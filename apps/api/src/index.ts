import fastify from 'fastify';
import { usernameRoutes } from './routes/username.js';
import { userRoutes } from './routes/auth.js';
import { RedisService } from './services/redisService.js';

// Create Fastify instance with pino-pretty logger configuration
const server = fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Register CORS plugin to allow requests from the Angular frontend
await server.register(import('@fastify/cors'), {
  origin: [
    'http://localhost:4200',  // Angular development server
    'http://127.0.0.1:4200',  // Alternative localhost
    'http://localhost:3000',  // Same origin
    'http://127.0.0.1:3000'   // Alternative same origin
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Health check route
server.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'api' };
});

// Basic API route
server.get('/api', async (request, reply) => {
  return { message: 'Hello from API service!' };
});

// Register username validation routes
server.register(usernameRoutes, { prefix: '/api' });

// Register user authentication routes
server.register(userRoutes, { prefix: '/api' });

const start = async (): Promise<void> => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`API server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal: string): Promise<void> => {
  server.log.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Close server
    await server.close();
    server.log.info('HTTP server closed');

    // Disconnect from Redis
    await RedisService.disconnect();
    server.log.info('Redis disconnected');

    // Option to clear cache on shutdown (configurable via environment variable)
    if (process.env.CLEAR_CACHE_ON_SHUTDOWN === 'true') {
      server.log.info('Clearing cache on shutdown...');
      const redis = RedisService.getInstance();
      await redis.flushdb();
      server.log.info('Cache cleared');
    }

    server.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    server.log.error(error, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  server.log.error(error, 'Uncaught exception');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  server.log.error({ reason, promise }, 'Unhandled rejection');
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  start();
}

export { server, start };
export default server;
