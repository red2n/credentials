import fastify from 'fastify';

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
    server.log.info(`API server listening on port ${port}`);
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
