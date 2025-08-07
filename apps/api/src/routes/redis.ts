import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RedisService } from '../services/redisService.js';

interface ClearCacheParams {
  pattern: string;
}

export async function redisRoutes(fastify: FastifyInstance) {
  // Redis health check endpoint
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const healthData = await RedisService.healthCheck();

      // Set appropriate HTTP status based on Redis health
      const statusCode = healthData.status === 'healthy' ? 200 :
                        healthData.status === 'degraded' ? 206 : 503;

      return reply.status(statusCode).send({
        success: true,
        data: healthData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Redis health check failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to check Redis health',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Redis statistics endpoint
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await RedisService.getStats();

      return reply.status(200).send({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Failed to get Redis stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve Redis statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cache analysis endpoint
  fastify.get('/cache/analysis', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const analysis = await RedisService.getCacheAnalysis();

      return reply.status(200).send({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Failed to analyze cache:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to analyze cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Clear cache by pattern endpoint
  fastify.delete('/cache/clear/:pattern', async (request: FastifyRequest<{ Params: ClearCacheParams }>, reply: FastifyReply) => {
    try {
      const { pattern } = request.params;

      // Validate pattern to prevent accidental deletion of all keys
      if (!pattern || pattern.trim() === '' || pattern === '*') {
        return reply.status(400).send({
          success: false,
          error: 'Pattern cannot be empty or wildcard (*). Use specific patterns like "user:*" or "session:*"'
        });
      }

      const result = await RedisService.clearCacheByPattern(pattern);

      fastify.log.info(`Cleared ${result.deletedCount} cache entries with pattern: ${pattern}`);

      return reply.status(200).send({
        success: true,
        data: {
          pattern,
          deletedCount: result.deletedCount,
          message: result.message
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Failed to clear cache:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Clear all cache endpoint (admin only - more dangerous)
  fastify.delete('/cache/clear-all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await RedisService.clearCache();

      fastify.log.warn('All cache data cleared by admin');

      return reply.status(200).send({
        success: true,
        data: {
          message: 'All cache data cleared successfully'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Failed to clear all cache:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
