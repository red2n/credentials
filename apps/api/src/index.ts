import fastify from 'fastify';
import { pino } from 'pino';

// Create logger
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Create Fastify instance
const server = fastify({
  logger: logger
});

// Health check route
server.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'api' };
});

// Basic API route
server.get('/api', async (request, reply) => {
  return { message: 'Hello from API service!' };
});

const start = async (): Promise<void> => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`API server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  start();
}

export { server, start };
export default server;
