import { Redis } from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string | undefined;
  db?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
}

export class RedisService {
  private static instance: Redis;

  static getInstance(config?: RedisConfig): Redis {
    if (!RedisService.instance) {
      const defaultConfig: RedisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
      };

      const finalConfig = { ...defaultConfig, ...config };

      const redisOptions: any = {
        host: finalConfig.host,
        port: finalConfig.port,
        db: finalConfig.db,
        enableReadyCheck: finalConfig.enableReadyCheck,
        maxRetriesPerRequest: finalConfig.maxRetriesPerRequest,
        lazyConnect: true, // Don't connect immediately
      };

      // Only add password if it exists
      if (finalConfig.password) {
        redisOptions.password = finalConfig.password;
      }

      RedisService.instance = new Redis(redisOptions);

      // Handle connection events
      RedisService.instance.on('connect', () => {
        console.log('Redis connected successfully');
      });

      RedisService.instance.on('error', (error) => {
        console.error('Redis connection error:', error.message);
      });

      RedisService.instance.on('close', () => {
        console.log('Redis connection closed');
      });
    }

    return RedisService.instance;
  }

  static async disconnect(): Promise<void> {
    if (RedisService.instance) {
      await RedisService.instance.quit();
      RedisService.instance = null as any;
    }
  }

  /**
   * Clear all cache data - useful for development/testing
   */
  static async clearCache(): Promise<void> {
    await RedisService.flushAll();
  }

  /**
   * Clear all cache data - useful for development/testing
   */
  static async flushAll(): Promise<void> {
    if (RedisService.instance) {
      await RedisService.instance.flushall();
      console.log('Redis cache cleared completely');
    }
  }

  /**
   * Clear cache data for specific database
   */
  static async flushDb(): Promise<void> {
    if (RedisService.instance) {
      await RedisService.instance.flushdb();
      console.log('Redis database cache cleared');
    }
  }

  /**
   * Get Redis memory usage information
   */
  static async getMemoryInfo(): Promise<any> {
    if (RedisService.instance) {
      const info = await RedisService.instance.info('memory');
      return info;
    }
    return null;
  }

  /**
   * Check if Redis is experiencing memory pressure
   */
  static async checkMemoryPressure(): Promise<{
    isUnderPressure: boolean;
    usedMemory: number;
    maxMemory: number;
  }> {
    try {
      const info = await RedisService.instance.info('memory');
      const lines = info.split('\r\n');

      let usedMemory = 0;
      let maxMemory = 0;

      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          const value = line.split(':')[1];
          if (value) {
            usedMemory = parseInt(value);
          }
        }
        if (line.startsWith('maxmemory:')) {
          const value = line.split(':')[1];
          if (value) {
            maxMemory = parseInt(value);
          }
        }
      }

      const isUnderPressure = maxMemory > 0 && (usedMemory / maxMemory) > 0.8;

      return {
        isUnderPressure,
        usedMemory,
        maxMemory
      };
    } catch (error) {
      console.error('Error checking memory pressure:', error);
      return {
        isUnderPressure: false,
        usedMemory: 0,
        maxMemory: 0
      };
    }
  }

  /**
   * Comprehensive Redis health check
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    connected: boolean;
    latency: number;
    memory: {
      used: number;
      max: number;
      percentage: number;
      isUnderPressure: boolean;
    };
    keyCount: number;
    uptime: number;
    version: string;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let connected = false;
    let latency = 0;
    let keyCount = 0;
    let uptime = 0;
    let version = 'unknown';
    let memory = {
      used: 0,
      max: 0,
      percentage: 0,
      isUnderPressure: false
    };

    try {
      // Test connection with PING
      await RedisService.instance.ping();
      connected = true;
      latency = Date.now() - startTime;

      // Get server info
      const serverInfo = await RedisService.instance.info('server');
      const serverLines = serverInfo.split('\r\n');
      for (const line of serverLines) {
        if (line.startsWith('uptime_in_seconds:')) {
          const value = line.split(':')[1];
          uptime = value ? parseInt(value) || 0 : 0;
        }
        if (line.startsWith('redis_version:')) {
          version = line.split(':')[1] || 'unknown';
        }
      }

      // Get key count
      const dbInfo = await RedisService.instance.info('keyspace');
      const dbLines = dbInfo.split('\r\n');
      for (const line of dbLines) {
        if (line.startsWith('db0:')) {
          const match = line.match(/keys=(\d+)/);
          if (match && match[1]) {
            keyCount = parseInt(match[1]);
          }
        }
      }

      // Get memory info
      const memoryInfo = await RedisService.checkMemoryPressure();
      memory = {
        used: memoryInfo.usedMemory,
        max: memoryInfo.maxMemory,
        percentage: memoryInfo.maxMemory > 0 ? (memoryInfo.usedMemory / memoryInfo.maxMemory) * 100 : 0,
        isUnderPressure: memoryInfo.isUnderPressure
      };

    } catch (error) {
      errors.push(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (!connected) {
      status = 'unhealthy';
    } else if (memory.isUnderPressure || latency > 1000 || errors.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      connected,
      latency,
      memory,
      keyCount,
      uptime,
      version,
      errors
    };
  }

  /**
   * Get Redis statistics
   */
  static async getStats(): Promise<{
    connections: number;
    commandsProcessed: number;
    opsPerSecond: number;
    hitRate: number;
    evictedKeys: number;
    expiredKeys: number;
  }> {
    try {
      const statsInfo = await RedisService.instance.info('stats');
      const lines = statsInfo.split('\r\n');

      let connections = 0;
      let commandsProcessed = 0;
      let hitRate = 0;
      let evictedKeys = 0;
      let expiredKeys = 0;
      let keyspaceHits = 0;
      let keyspaceMisses = 0;

      for (const line of lines) {
        if (line.startsWith('total_connections_received:')) {
          const value = line.split(':')[1];
          connections = value ? parseInt(value) || 0 : 0;
        }
        if (line.startsWith('total_commands_processed:')) {
          const value = line.split(':')[1];
          commandsProcessed = value ? parseInt(value) || 0 : 0;
        }
        if (line.startsWith('evicted_keys:')) {
          const value = line.split(':')[1];
          evictedKeys = value ? parseInt(value) || 0 : 0;
        }
        if (line.startsWith('expired_keys:')) {
          const value = line.split(':')[1];
          expiredKeys = value ? parseInt(value) || 0 : 0;
        }
        if (line.startsWith('keyspace_hits:')) {
          const value = line.split(':')[1];
          keyspaceHits = value ? parseInt(value) || 0 : 0;
        }
        if (line.startsWith('keyspace_misses:')) {
          const value = line.split(':')[1];
          keyspaceMisses = value ? parseInt(value) || 0 : 0;
        }
      }

      // Calculate hit rate
      const totalRequests = keyspaceHits + keyspaceMisses;
      hitRate = totalRequests > 0 ? (keyspaceHits / totalRequests) * 100 : 0;

      // Calculate ops per second (rough estimate)
      const uptimeInfo = await RedisService.instance.info('server');
      const uptimeLines = uptimeInfo.split('\r\n');
      let uptime = 1;
      for (const line of uptimeLines) {
        if (line.startsWith('uptime_in_seconds:')) {
          const value = line.split(':')[1];
          uptime = value ? parseInt(value) || 1 : 1;
        }
      }
      const opsPerSecond = commandsProcessed / uptime;

      return {
        connections,
        commandsProcessed,
        opsPerSecond: Math.round(opsPerSecond * 100) / 100,
        hitRate: Math.round(hitRate * 100) / 100,
        evictedKeys,
        expiredKeys
      };
    } catch (error) {
      console.error('Error getting Redis stats:', error);
      return {
        connections: 0,
        commandsProcessed: 0,
        opsPerSecond: 0,
        hitRate: 0,
        evictedKeys: 0,
        expiredKeys: 0
      };
    }
  }

  /**
   * Get cache key patterns and their counts
   */
  static async getCacheAnalysis(): Promise<{
    totalKeys: number;
    patterns: Array<{
      pattern: string;
      count: number;
      examples: string[];
    }>;
  }> {
    try {
      const keys = await RedisService.instance.keys('*');
      const patterns = new Map<string, string[]>();

      // Group keys by pattern
      for (const key of keys) {
        let pattern = key;
        // Replace numbers with * to create patterns
        pattern = pattern.replace(/\d+/g, '*');
        // Replace UUIDs with *
        pattern = pattern.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '*');

        if (!patterns.has(pattern)) {
          patterns.set(pattern, []);
        }
        patterns.get(pattern)!.push(key);
      }

      const patternArray = Array.from(patterns.entries()).map(([pattern, keys]) => ({
        pattern,
        count: keys.length,
        examples: keys.slice(0, 5) // Show first 5 examples
      }));

      return {
        totalKeys: keys.length,
        patterns: patternArray.sort((a, b) => b.count - a.count)
      };
    } catch (error) {
      console.error('Error analyzing cache:', error);
      return {
        totalKeys: 0,
        patterns: []
      };
    }
  }

  /**
   * Clear cache by pattern
   */
  static async clearCacheByPattern(pattern: string): Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }> {
    try {
      const keys = await RedisService.instance.keys(pattern);

      if (keys.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: `No keys found matching pattern: ${pattern}`
        };
      }

      // Delete in batches to avoid blocking
      const batchSize = 1000;
      let deletedCount = 0;

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const result = await RedisService.instance.del(...batch);
        deletedCount += result;
      }

      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} keys matching pattern: ${pattern}`
      };
    } catch (error) {
      console.error('Error clearing cache by pattern:', error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
