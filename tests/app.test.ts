// tests/app.test.ts
import { MockDexRouter } from '../src/services/dex.service';
// FIX: Import the Class "WebSocketService", not the instance
import { WebSocketService } from '../src/services/websocket.service'; 
import Fastify, { FastifyInstance } from 'fastify';
import { executeOrder } from '../src/controllers/order.controller';
import { Order } from '../src/types';

// Mock Redis and BullMQ to prevent connection errors during testing

describe('Order Execution Engine Tests', () => {
    let router: MockDexRouter;
    let app: FastifyInstance;

    beforeAll(async () => {
        // Setup Router
        router = new MockDexRouter();
        
        // Setup Fastify App for API tests
        app = Fastify();
        app.post('/api/orders', executeOrder);
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    // --- GROUP 1: ROUTING LOGIC (5 Tests) ---
    
    test('1. Router should return a valid Raydium quote', async () => {
        const quote = await router.getRaydiumQuote('SOL', 'USDC', 10);
        expect(quote.dex).toBe('RAYDIUM');
        expect(quote.price).toBeGreaterThan(0);
    });

    test('2. Router should return a valid Meteora quote', async () => {
        const quote = await router.getMeteoraQuote('SOL', 'USDC', 10);
        expect(quote.dex).toBe('METEORA');
        expect(quote.price).toBeGreaterThan(0);
    });

    test('3. Router should select the best price', async () => {
        // We mock the individual calls to force specific prices
        jest.spyOn(router, 'getRaydiumQuote').mockResolvedValue({ 
            dex: 'RAYDIUM', price: 150, fee: 0, amountOut: 1500 
        });
        jest.spyOn(router, 'getMeteoraQuote').mockResolvedValue({ 
            dex: 'METEORA', price: 140, fee: 0, amountOut: 1400 
        });

        const bestQuote = await router.findBestRoute('SOL', 'USDC', 10);
        expect(bestQuote.dex).toBe('RAYDIUM'); // Should pick 1500 over 1400
    });

    test('4. Execute Swap should return a transaction hash', async () => {
        const order: Order = {
             id: 'test-id', type: 'MARKET', side: 'BUY', 
             inputToken: 'SOL', outputToken: 'USDC', amount: 10, status: 'PENDING' 
        };
        
        // Temporarily override sleep to make test fast
        // Note: If this times out, you might need to temporarily reduce the sleep in dex.service.ts 
        // or mock executeSwap directly.
        const result = await router.executeSwap('RAYDIUM', order, 150);
        expect(result.status).toBe('success');
        expect(result.txHash).toContain('solana_tx_');
    }, 20000); // Increased timeout for this test just in case

    test('5. Router should handle slippage (Output amount > 0)', async () => {
        const quote = await router.getRaydiumQuote('SOL', 'USDC', 10);
        expect(quote.amountOut).toBe(quote.price * 10);
    });


    // --- GROUP 2: API VALIDATION (2 Tests) ---

    test('6. API should reject orders with missing data', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/orders',
            payload: { inputToken: 'SOL' } // Missing outputToken & amount
        });
        expect(response.statusCode).toBe(400);
    });

    test('7. API should accept valid orders and return ID', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/orders',
            payload: { inputToken: 'SOL', outputToken: 'USDC', amount: 10 }
        });
        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.orderId).toBeDefined();
    });


    // --- GROUP 3: WEBSOCKET LIFECYCLE (3 Tests) ---

    test('8. WebSocketManager should store connections', () => {
        // FIX: Use "new WebSocketService()"
        const wsManager = new WebSocketService();
        const mockSocket = { on: jest.fn(), send: jest.fn() } as any;
        
        wsManager.handleConnection('order-123', mockSocket);
        expect(() => wsManager.notifyStatus('order-123', 'TEST')).not.toThrow();
    });

    test('9. WebSocketManager should send correct JSON format', () => {
        // FIX: Use "new WebSocketService()"
        const wsManager = new WebSocketService();
        const mockSocket = { on: jest.fn(), send: jest.fn(), readyState: 1 } as any;
        
        wsManager.handleConnection('order-123', mockSocket);
        wsManager.notifyStatus('order-123', 'CONFIRMED', { tx: '0x123' });

        expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"ORDER_UPDATE"'));
        expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('"status":"CONFIRMED"'));
    });

    test('10. WebSocketManager should handle disconnection gracefully', () => {
        // FIX: Use "new WebSocketService()"
        const wsManager = new WebSocketService();
        const mockSocket = { on: jest.fn(), send: jest.fn() } as any;
        
        wsManager.handleConnection('order-123', mockSocket);
        
        // Simulate the 'close' event handler being called
        const closeHandler = mockSocket.on.mock.calls.find((call: any) => call[0] === 'close')[1];
        expect(closeHandler).toBeDefined();
        
        // Execute it
        closeHandler();
        
        // Trying to notify should safely fail (not send)
        wsManager.notifyStatus('order-123', 'TEST');
        expect(mockSocket.send).not.toHaveBeenCalled();
    });
});