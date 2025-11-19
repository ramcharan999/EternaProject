// src/services/dex.service.ts
import { Order, Quote, ExecutionResult } from '../types';

// Helper to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDexRouter {
    // Mock base prices for simulation (e.g., 1 SOL = 150 USDC)
    private readonly BASE_PRICES: Record<string, number> = {
        'SOL-USDC': 150.00,
        'USDC-SOL': 0.0066, // 1 / 150
    };

    /**
     * 1. GET RAYDIUM QUOTE
     * Simulates fetching a price from Raydium with specific variance
     */
    async getRaydiumQuote(inputToken: string, outputToken: string, amount: number): Promise<Quote> {
        await sleep(200); // Simulate network delay [cite: 97]

        const pair = `${inputToken}-${outputToken}`;
        const basePrice = this.BASE_PRICES[pair] || 0;

        // Logic from assignment: price * (0.98 + random * 0.04) [cite: 99]
        const variance = 0.98 + Math.random() * 0.04;
        const price = basePrice * variance;

        return {
            dex: 'RAYDIUM',
            price: price,
            fee: 0.003, // 0.3% fee
            amountOut: amount * price
        };
    }

    /**
     * 2. GET METEORA QUOTE
     * Simulates fetching a price from Meteora with different variance
     */
    async getMeteoraQuote(inputToken: string, outputToken: string, amount: number): Promise<Quote> {
        await sleep(200); // Simulate network delay

        const pair = `${inputToken}-${outputToken}`;
        const basePrice = this.BASE_PRICES[pair] || 0;

        // Logic from assignment: price * (0.97 + random * 0.05) [cite: 101]
        const variance = 0.97 + Math.random() * 0.05;
        const price = basePrice * variance;

        return {
            dex: 'METEORA',
            price: price,
            fee: 0.002, // 0.2% fee
            amountOut: amount * price
        };
    }

    /**
     * 3. ROUTING LOGIC
     * Fetches both quotes and returns the best one
     */
    async findBestRoute(inputToken: string, outputToken: string, amount: number): Promise<Quote> {
        // Fetch both quotes in parallel (Concurrent Processing)
        const [raydiumQuote, meteoraQuote] = await Promise.all([
            this.getRaydiumQuote(inputToken, outputToken, amount),
            this.getMeteoraQuote(inputToken, outputToken, amount)
        ]);

        console.log(`[Router] Raydium: ${raydiumQuote.amountOut} | Meteora: ${meteoraQuote.amountOut}`);

        // Simple comparison: Return the one with higher output amount
        return raydiumQuote.amountOut > meteoraQuote.amountOut ? raydiumQuote : meteoraQuote;
    }

    /**
     * 4. EXECUTE SWAP
     * Simulates the actual transaction on the chosen DEX
     */
  /**
     * 4. EXECUTE SWAP
     */
    async executeSwap(dex: string, order: Order, finalPrice: number): Promise<ExecutionResult> {
        console.log(`[Execution] Swapping on ${dex}...`);
        
        // CHANGE THIS LINE: Increase delay to 15 seconds (15000 ms)
        // This gives you time to copy the ID and connect!
        await sleep(15000); 

        const mockTxHash = 'solana_tx_' + Math.random().toString(36).substring(7);

        return {
            txHash: mockTxHash,
            executedPrice: finalPrice,
            status: 'success'
        };
    }
}