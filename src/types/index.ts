// src/types/index.ts

export interface Order {
    id: string;
    type: 'MARKET' | 'LIMIT' | 'SNIPER'; // We are focusing on MARKET
    side: 'BUY' | 'SELL';
    inputToken: string; // e.g., 'SOL'
    outputToken: string; // e.g., 'USDC'
    amount: number;
    status: 'PENDING' | 'ROUTING' | 'BUILDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
}

export interface Quote {
    dex: 'RAYDIUM' | 'METEORA';
    price: number;
    fee: number;
    amountOut: number;
}

export interface ExecutionResult {
    txHash: string;
    executedPrice: number;
    status: 'success' | 'failed';
}