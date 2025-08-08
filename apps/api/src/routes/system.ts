import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RedisService } from '../services/redisService.js';
import { InMemoryUserDB } from '../services/inMemoryUserDB.js';
import os from 'os';

export async function systemRoutes(fastify: FastifyInstance) {
  const redis = RedisService.getInstance();
  const userDB = InMemoryUserDB.getInstance();

  // System status endpoint
  fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const startTime = process.hrtime();

      // Get Redis health
      const redisHealth = await RedisService.healthCheck();

      // Get system info
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const systemUptime = os.uptime();

      // Get database stats
      const dbStats = userDB.getStats();

      // Calculate response time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

      const systemStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
          process: Math.floor(uptime),
          system: Math.floor(systemUptime),
          processFormatted: formatUptime(uptime),
          systemFormatted: formatUptime(systemUptime)
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          cpus: os.cpus().length,
          loadAverage: os.loadavg(),
          totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
          freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024), // GB
        },
        database: {
          totalUsers: dbStats.totalUsers,
          usersWithLastLogin: dbStats.usersWithLastLogin,
          averageUsernameLength: dbStats.averageUsernameLength,
          memoryUsage: dbStats.memoryUsage,
          status: dbStats.totalUsers > 0 ? 'connected' : 'empty'
        },
        redis: {
          status: redisHealth.connected ? 'connected' : 'disconnected',
          latency: redisHealth.latency,
          memory: redisHealth.memory,
          keyCount: redisHealth.keyCount,
          version: redisHealth.version
        },
        performance: {
          responseTime: Math.round(responseTime * 100) / 100, // Round to 2 decimal places
          pid: process.pid,
          environment: process.env.NODE_ENV || 'development'
        }
      };

      return {
        success: true,
        data: systemStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      fastify.log.error('Error getting system status:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get system status',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Simple health check endpoint
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const redisConnected = await redis.ping();
      const dbStats = userDB.getStats();
      const dbConnected = dbStats.totalUsers >= 0;

      const isHealthy = redisConnected && dbConnected;

      return {
        success: true,
        data: {
          status: isHealthy ? 'healthy' : 'degraded',
          services: {
            api: 'healthy',
            redis: redisConnected ? 'healthy' : 'unhealthy',
            database: dbConnected ? 'healthy' : 'unhealthy'
          },
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      fastify.log.error('Error in health check:', error);
      return reply.status(503).send({
        success: false,
        data: {
          status: 'unhealthy',
          error: 'Health check failed'
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  // System metrics endpoint (lighter version for frequent polling)
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const dbStats = userDB.getStats();

      return {
        success: true,
        data: {
          uptime: Math.floor(uptime),
          memory: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          },
          users: dbStats.totalUsers,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      fastify.log.error('Error getting system metrics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get system metrics',
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
