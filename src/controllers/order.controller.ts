// src/controllers/order.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderQueueService } from '../services/queue.service';
import { Order } from '../types';
import { v4 as uuidv4 } from 'uuid'; // We need to install this

const queueService = new OrderQueueService();

export const executeOrder = async (req: FastifyRequest, reply: FastifyReply) => {
    const { inputToken, outputToken, amount } = req.body as any;

    // 1. Basic Validation
    if (!inputToken || !outputToken || !amount) {
        return reply.status(400).send({ error: 'Missing required fields' });
    }

    // 2. Create the Order Object
    // We default to MARKET orders as decided earlier
    const orderId = uuidv4();
    const order: Order = {
        id: orderId,
        type: 'MARKET',
        side: 'BUY',
        inputToken,
        outputToken,
        amount,
        status: 'PENDING'
    };

    // 3. Push to Queue (The "Producer" step)
    await queueService.addOrderToQueue(order);

    // 4. Return immediately (Async processing)
    return reply.status(201).send({ 
        message: 'Order queued successfully',
        orderId: orderId 
    });
};