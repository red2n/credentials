import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsernameBloomFilter } from '../services/usernameBloomFilter.js';
import { RedisService } from '../services/redisService.js';

interface UsernameValidationRequest {
  Body: {
    username: string;
  };
}

interface UsernameAddRequest {
  Body: {
    username: string;
  };
}

export async function usernameRoutes(fastify: FastifyInstance) {
  // Initialize Redis and Bloom filter service
  const redis = RedisService.getInstance();
  const bloomFilterConfig = {
    capacity: 10000,
    errorRate: 0.01,
    redisKey: 'username_bloom_filter'
  };

  const bloomFilter = new UsernameBloomFilter(redis, bloomFilterConfig);
  await bloomFilter.initialize();

  // Endpoint to check if username might exist
  fastify.post<UsernameValidationRequest>('/username/validate', {
    schema: {
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request: FastifyRequest<UsernameValidationRequest>, reply: FastifyReply) => {
    try {
      const { username } = request.body;

      // Validate username format
      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return reply.status(400).send({
          error: 'Invalid username',
          message: 'Username must be a non-empty string'
        });
      }

      const normalizedUsername = username.toLowerCase().trim();
      const mightExist = await bloomFilter.mightExist(normalizedUsername);

      fastify.log.info({ username: normalizedUsername, mightExist }, 'Username validation check');

      return reply.send({
        username: normalizedUsername,
        mightExist,
        message: mightExist
          ? 'Username might already exist (please try a different one)'
          : 'Username appears to be available'
      });
    } catch (error) {
      fastify.log.error(error, 'Error validating username');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to validate username'
      });
    }
  });

  // Endpoint to add username to the filter (for administrative use)
  fastify.post<UsernameAddRequest>('/username/add', {
    schema: {
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request: FastifyRequest<UsernameAddRequest>, reply: FastifyReply) => {
    try {
      const { username } = request.body;

      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return reply.status(400).send({
          error: 'Invalid username',
          message: 'Username must be a non-empty string'
        });
      }

      const normalizedUsername = username.toLowerCase().trim();
      await bloomFilter.addUsername(normalizedUsername);

      fastify.log.info({ username: normalizedUsername }, 'Username added to bloom filter');

      return reply.send({
        username: normalizedUsername,
        message: 'Username added to validation filter successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error adding username to filter');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to add username to filter'
      });
    }
  });

  // Endpoint to get bloom filter statistics
  fastify.get('/username/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await bloomFilter.getStats();

      return reply.send({
        ...stats,
        message: 'Bloom filter statistics retrieved successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting bloom filter stats');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to get bloom filter statistics'
      });
    }
  });

  // Cache management endpoints (for administrative use)

  // Clear cache and restart fresh
  fastify.post('/username/cache/clear', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await bloomFilter.clear();
      await bloomFilter.initialize();

      fastify.log.info('Bloom filter cache cleared and reinitialized');

      return reply.send({
        message: 'Cache cleared and reinitialized successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error clearing cache');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to clear cache'
      });
    }
  });

  // Rebuild bloom filter from stored elements
  fastify.post('/username/cache/rebuild', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await bloomFilter.rebuild();

      fastify.log.info('Bloom filter rebuilt from stored elements');

      return reply.send({
        message: 'Bloom filter rebuilt successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error rebuilding bloom filter');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to rebuild bloom filter'
      });
    }
  });

  // Validate cache integrity
  fastify.get('/username/cache/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validation = await bloomFilter.validateCache();

      const status = validation.isValid ? 200 : 422;

      return reply.status(status).send({
        ...validation,
        message: validation.isValid
          ? 'Cache validation passed'
          : 'Cache validation failed - consider rebuilding'
      });
    } catch (error) {
      fastify.log.error(error, 'Error validating cache');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to validate cache'
      });
    }
  });

  // Force cache refresh
  fastify.post('/username/cache/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await bloomFilter.refreshCache();

      fastify.log.info('Cache refreshed successfully');

      return reply.send({
        message: 'Cache refreshed successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error refreshing cache');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to refresh cache'
      });
    }
  });

  // Redis health check
  fastify.get('/username/cache/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { RedisService } = await import('../services/redisService.js');
      const health = await RedisService.healthCheck();
      const memoryInfo = await RedisService.checkMemoryPressure();

      const status = health.status === 'connected' ? 200 : 503;

      return reply.status(status).send({
        redis: health,
        memory: memoryInfo,
        message: health.status === 'connected'
          ? 'Redis is healthy'
          : 'Redis connection issues detected'
      });
    } catch (error) {
      fastify.log.error(error, 'Error checking Redis health');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to check Redis health'
      });
    }
  });
}
