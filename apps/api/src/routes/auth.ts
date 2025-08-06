import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InMemoryUserDB } from '../services/inMemoryUserDB.js';

interface AuthRequest {
  Body: {
    username: string;
    password: string;
  };
}

interface CreateUserRequest {
  Body: {
    username: string;
    password: string;
    email?: string;
  };
}

export async function userRoutes(fastify: FastifyInstance) {
  const userDB = InMemoryUserDB.getInstance();

  // Initialize the database
  await userDB.initialize(10000);

  // User authentication endpoint
  fastify.post<AuthRequest>('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request: FastifyRequest<AuthRequest>, reply: FastifyReply) => {
    try {
      const { username, password } = request.body;

      const user = userDB.authenticate(username, password);

      if (user) {
        fastify.log.info({ username: user.username }, 'User authenticated successfully');

        return reply.send({
          success: true,
          message: 'Authentication successful',
          user: {
            username: user.username,
            email: user.email,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          }
        });
      } else {
        fastify.log.warn({ username }, 'Authentication failed');

        return reply.status(401).send({
          success: false,
          message: 'Invalid username or password'
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Error during authentication');
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Check if user exists (fast lookup using Bloom filter)
  fastify.get('/auth/check/:username', async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
    try {
      const { username } = request.params;

      if (!username) {
        return reply.status(400).send({
          error: 'Username parameter required'
        });
      }

      // This is a fast check - no need for Bloom filter here as we have in-memory access
      const exists = userDB.userExists(username);

      return reply.send({
        username: username.toLowerCase(),
        exists,
        message: exists ? 'Username exists' : 'Username available'
      });
    } catch (error) {
      fastify.log.error(error, 'Error checking user existence');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to check user existence'
      });
    }
  });

  // Create new user
  fastify.post<CreateUserRequest>('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request: FastifyRequest<CreateUserRequest>, reply: FastifyReply) => {
    try {
      const { username, password, email } = request.body;

      const success = userDB.addUser(username, password, email);

      if (success) {
        fastify.log.info({ username }, 'New user created');

        return reply.status(201).send({
          success: true,
          message: 'User created successfully',
          username: username.toLowerCase()
        });
      } else {
        return reply.status(409).send({
          success: false,
          message: 'Username already exists'
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Error creating user');
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Get user profile
  fastify.get('/auth/profile/:username', async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
    try {
      const { username } = request.params;

      const user = userDB.getUser(username);

      if (user) {
        return reply.send({
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        });
      } else {
        return reply.status(404).send({
          error: 'User not found'
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Error getting user profile');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get database statistics
  fastify.get('/auth/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = userDB.getStats();

      return reply.send({
        ...stats,
        message: 'Database statistics retrieved successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting database stats');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Get random usernames for testing
  fastify.get('/auth/random/:count', async (request: FastifyRequest<{ Params: { count: string } }>, reply: FastifyReply) => {
    try {
      const count = parseInt(request.params.count) || 10;

      if (count > 1000) {
        return reply.status(400).send({
          error: 'Count cannot exceed 1000'
        });
      }

      const usernames = userDB.getRandomUsernames(count);

      return reply.send({
        count: usernames.length,
        usernames,
        message: 'Random usernames retrieved successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting random usernames');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Database management endpoints

  // Clear database
  fastify.post('/auth/admin/clear', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      userDB.clear();

      fastify.log.info('Database cleared by admin');

      return reply.send({
        message: 'Database cleared successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error clearing database');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  // Reinitialize database
  fastify.post('/auth/admin/init', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      userDB.clear();
      await userDB.initialize(10000);

      fastify.log.info('Database reinitialized by admin');

      return reply.send({
        message: 'Database reinitialized with 10,000 users successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error reinitializing database');
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });
}
