// src/services/queue.service.ts
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { MockDexRouter } from './dex.service';
import { Order } from '../types';
import { websocketManager } from './websocket.service';
// Connection to our Docker Redis
const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null
});

export class OrderQueueService {
    private orderQueue: Queue;
    private dexRouter: MockDexRouter;

    constructor() {
        this.dexRouter = new MockDexRouter();
        
        // 1. Initialize the Queue
        this.orderQueue = new Queue('order-execution-queue', { 
            connection: redisConnection 
        });

        // 2. Initialize the Worker (The Consumer)
        new Worker('order-execution-queue', async (job: Job) => {
            console.log(`[Worker] Processing Order ID: ${job.data.id}`);
            await this.processOrder(job.data);
        }, { 
            connection: redisConnection,
            concurrency: 10,
            limiter: {
                max: 100,
                duration: 60000
            } 
        });
    }

    // Method to add a new order to the queue
    async addOrderToQueue(order: Order) {
        await this.orderQueue.add('execute-order', order, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });
        console.log(`[Queue] Order ${order.id} added to queue.`);
    }

    // The core logic run by the worker
   // The core logic run by the worker
    private async processOrder(order: Order) {
        const { id } = order;

        // 1. ROUTING
        websocketManager.notifyStatus(id, 'ROUTING');
        const bestQuote = await this.dexRouter.findBestRoute(order.inputToken, order.outputToken, order.amount);
        
        // Notify user about the decision
        websocketManager.notifyStatus(id, 'ROUTING_COMPLETE', { 
            route: bestQuote.dex, 
            price: bestQuote.price 
        });

        // 2. BUILDING & SUBMITTING
        websocketManager.notifyStatus(id, 'BUILDING');
        websocketManager.notifyStatus(id, 'SUBMITTED');

        // 3. EXECUTION
        const result = await this.dexRouter.executeSwap(bestQuote.dex, order, bestQuote.price);

        if (result.status === 'success') {
            console.log(`[Success] Order ${id} confirmed.`);
            // 4. CONFIRMED
            websocketManager.notifyStatus(id, 'CONFIRMED', { 
                txHash: result.txHash,
                finalPrice: result.executedPrice
            });
        } else {
            websocketManager.notifyStatus(id, 'FAILED', { reason: 'Swap simulation failed' });
            throw new Error('Swap failed');
        }
    }
}