// src/index.ts
import Fastify from 'fastify';
import websocket from '@fastify/websocket'; // Import the plugin
import dotenv from 'dotenv';
import { executeOrder } from './controllers/order.controller';
import { websocketManager } from './services/websocket.service'; // Import manager

dotenv.config();

const server = Fastify({ logger: true });

// 1. Register WebSocket Plugin
server.register(websocket);

// 2. Register Routes
server.post('/api/orders', executeOrder);

// 3. Register WebSocket Endpoint
// Users connect to: ws://localhost:3000/ws/orders/:orderId
// 3. Register WebSocket Endpoint
// 3. Register WebSocket Endpoint
server.register(async (fastify) => {
    fastify.get('/ws/orders/:orderId', { websocket: true }, (connection, req: any) => {
        const { orderId } = req.params;
        
        // EXPLANATION: 
        // Sometimes 'connection' IS the socket, sometimes it's a wrapper with '.socket'.
        // This line checks both possibilities to ensure we never pass 'undefined'.
        const clientSocket = (connection as any).socket || connection;

        if (clientSocket) {
            websocketManager.handleConnection(orderId, clientSocket);
        } else {
            console.error('[WebSocket Error] Could not extract socket from connection object');
        }
    });
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server running athttp://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();