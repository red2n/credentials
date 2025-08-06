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

  static async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await RedisService.instance.ping();
      const latency = Date.now() - start;

      return {
        status: 'connected',
        latency
      };
    } catch (error) {
      return {
        status: 'disconnected'
      };
    }
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
}
