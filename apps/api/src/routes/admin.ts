import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InMemoryUserDB } from '../services/inMemoryUserDB.js';

interface AdminUserActionRequest {
  Params: {
    username: string;
  };
}

interface AdminUserListRequest {
  Querystring: {
    page?: string;
    limit?: string;
    search?: string;
  };
}

export async function adminRoutes(fastify: FastifyInstance) {
  const userDB = InMemoryUserDB.getInstance();

  // Middleware to check admin authentication (simplified for demo)
  const checkAdminAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    // In a real application, you would verify admin JWT token or session
    // For this demo, we'll just check for a simple admin header
    const adminKey = request.headers['x-admin-key'];

    if (adminKey !== 'admin123') {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }
  };

  // Apply admin authentication to all admin routes
  fastify.addHook('preHandler', checkAdminAuth);

  // Get all users with pagination and search
  fastify.get<AdminUserListRequest>('/admin/users', async (request: FastifyRequest<AdminUserListRequest>, reply: FastifyReply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '50');
      const search = request.query.search || '';

      // Get all users
      let allUsers = Array.from(userDB.getAllUsers());

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        allUsers = allUsers.filter(user =>
          user.username.toLowerCase().includes(searchLower) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }

      // Calculate pagination
      const totalUsers = allUsers.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      // Get paginated results
      const users = allUsers
        .slice(startIndex, endIndex)
        .map(user => ({
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          isActive: true // All users are active by default in our current system
        }));

      return reply.send({
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting users list');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve users'
      });
    }
  });

  // Get specific user details
  fastify.get<AdminUserActionRequest>('/admin/users/:username', async (request: FastifyRequest<AdminUserActionRequest>, reply: FastifyReply) => {
    try {
      const { username } = request.params;
      const user = userDB.getUser(username);

      if (!user) {
        return reply.status(404).send({
          error: 'User not found',
          message: `User '${username}' does not exist`
        });
      }

      return reply.send({
        user: {
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          isActive: true
        },
        message: 'User details retrieved successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting user details');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve user details'
      });
    }
  });

  // Deactivate (remove) user
  fastify.delete<AdminUserActionRequest>('/admin/users/:username', async (request: FastifyRequest<AdminUserActionRequest>, reply: FastifyReply) => {
    try {
      const { username } = request.params;

      // Check if user exists first
      const user = userDB.getUser(username);
      if (!user) {
        return reply.status(404).send({
          error: 'User not found',
          message: `User '${username}' does not exist`
        });
      }

      // Remove the user
      const success = userDB.removeUser(username);

      if (success) {
        fastify.log.info({ username }, 'User deactivated by admin');

        return reply.send({
          success: true,
          message: `User '${username}' has been deactivated successfully`,
          user: {
            username: user.username,
            email: user.email,
            deactivatedAt: new Date()
          }
        });
      } else {
        return reply.status(500).send({
          error: 'Deactivation failed',
          message: 'Failed to deactivate user'
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Error deactivating user');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to deactivate user'
      });
    }
  });

  // Reactivate user (in a real system, you'd restore from archive)
  fastify.post<AdminUserActionRequest>('/admin/users/:username/reactivate', async (request: FastifyRequest<AdminUserActionRequest>, reply: FastifyReply) => {
    try {
      const { username } = request.params;

      // For this demo, we'll just return a message since we actually delete users
      // In a real system, you'd restore the user from an archive or soft-delete table

      return reply.status(400).send({
        error: 'Cannot reactivate',
        message: 'User has been permanently removed. Reactivation not available in this demo.'
      });
    } catch (error) {
      fastify.log.error(error, 'Error reactivating user');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to reactivate user'
      });
    }
  });

  // Get admin dashboard statistics
  fastify.get('/admin/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = userDB.getStats();

      // Additional admin-specific statistics
      const allUsers = Array.from(userDB.getAllUsers());
      const recentUsers = allUsers.filter(user => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return user.createdAt > dayAgo;
      }).length;

      const activeUsers = allUsers.filter(user => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return user.lastLogin && user.lastLogin > weekAgo;
      }).length;

      return reply.send({
        ...stats,
        recentUsers24h: recentUsers,
        activeUsersWeek: activeUsers,
        userGrowthToday: recentUsers,
        systemHealth: 'healthy',
        message: 'Admin statistics retrieved successfully'
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting admin stats');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve admin statistics'
      });
    }
  });

  // Bulk user operations
  fastify.post('/admin/users/bulk-deactivate', {
    schema: {
      body: {
        type: 'object',
        required: ['usernames'],
        properties: {
          usernames: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 100
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { usernames: string[] } }>, reply: FastifyReply) => {
    try {
      const { usernames } = request.body;
      const results = {
        success: [] as string[],
        failed: [] as string[],
        notFound: [] as string[]
      };

      for (const username of usernames) {
        const user = userDB.getUser(username);
        if (!user) {
          results.notFound.push(username);
          continue;
        }

        const success = userDB.removeUser(username);
        if (success) {
          results.success.push(username);
          fastify.log.info({ username }, 'User bulk deactivated by admin');
        } else {
          results.failed.push(username);
        }
      }

      return reply.send({
        results,
        summary: {
          total: usernames.length,
          successful: results.success.length,
          failed: results.failed.length,
          notFound: results.notFound.length
        },
        message: `Bulk deactivation completed. ${results.success.length} users deactivated.`
      });
    } catch (error) {
      fastify.log.error(error, 'Error in bulk deactivation');
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to perform bulk deactivation'
      });
    }
  });
}
