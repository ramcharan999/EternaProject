// src/services/websocket.service.ts
import { WebSocket } from 'ws';

export class WebSocketService {
    // Map to store connections: OrderID -> WebSocket Connection
    private connections: Map<string, WebSocket> = new Map();

    // 1. Save a connection when a user connects
    handleConnection(orderId: string, socket: WebSocket) {
        this.connections.set(orderId, socket);
        console.log(`[WebSocket] Client connected for Order: ${orderId}`);

        // Clean up when they disconnect
        socket.on('close', () => {
            this.connections.delete(orderId);
            console.log(`[WebSocket] Client disconnected: ${orderId}`);
        });
    }

    // 2. Send an update to a specific user
    notifyStatus(orderId: string, status: string, data: any = {}) {
        const socket = this.connections.get(orderId);
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'ORDER_UPDATE',
                orderId,
                status,
                ...data,
                timestamp: new Date().toISOString()
            });
            socket.send(message);
        }
    }
}

// Export a single instance (Singleton) so we share it across the app
export const websocketManager = new WebSocketService();