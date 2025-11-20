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
// src/index.ts

// ... inside the websocket register block ...
// src/index.ts

// ... imports above ...

server.register(async (fastify) => {
    
    // 1. DEBUG PING ROUTE (Fixed to avoid errors)
    fastify.get('/ws/ping', { websocket: true }, (connection, req) => {
        console.log("Ping connected!");
        // "as any" stops the red squiggly line
        const client = (connection as any).socket || connection;
        
        if (client && client.send) {
            client.send('pong');
        } else {
            console.error("Ping failed: No socket found");
        }
    });

    // 2. ORDERS ROUTE (Fixed to avoid errors)
    fastify.get('/ws/orders/:orderId', { websocket: true }, (connection, req: any) => {
        const { orderId } = req.params;
        console.log(`Connection attempt for Order: ${orderId}`);
        
        // "as any" stops the red squiggly line
        const clientSocket = (connection as any).socket || connection;

        if (clientSocket) {
            websocketManager.handleConnection(orderId, clientSocket);
        } else {
            console.error("Socket missing for order connection");
        }
    });
});

// ... rest of the file ...

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        // CRITICAL FIX: You MUST include host: '0.0.0.0' for Docker/Render
        await server.listen({ port, host: '0.0.0.0' }); 
        console.log(`Server running at http://0.0.0.0:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();