import Fastify from 'fastify';
import dotenv from 'dotenv';

// Import application route handlers from source files
import { executeOrder } from '../src/controllers/order.controller';

dotenv.config();

// Cache the server across invocations to improve cold-starts.
let cachedServer: any = null;

async function buildServer() {
  const server = Fastify({ logger: true });

  // Only register the minimal routes needed for serverless handling.
  server.post('/api/orders', executeOrder as any);

  // Root health route for the deployment
  server.get('/', async (req, reply) => {
    return reply.send({ message: 'Eterna API is running' });
  });

  await server.ready();
  return server;
}

export default async function handler(req: any, res: any) {
  try {
    if (!cachedServer) {
      cachedServer = await buildServer();
    }

    // Let the underlying Node HTTP server handle the request
    // Fastify exposes the raw http.Server instance as `.server`.
    return cachedServer.server.emit('request', req, res);
  } catch (err: any) {
    // In case of an error, return 500 so Vercel shows a meaningful response
    console.error('Serverless handler error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
