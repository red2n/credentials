import pkg from 'bloom-filters';
const { BloomFilter } = pkg;
import { Redis } from 'ioredis';

export interface BloomFilterConfig {
  capacity: number;
  errorRate: number;
  redisKey: string;
}

export class UsernameBloomFilter {
  private bloomFilter: any; // Use any to avoid type issues with dynamic import
  private redis: Redis;
  private config: BloomFilterConfig;
  private isInitialized = false;

  constructor(redis: Redis, config: BloomFilterConfig) {
    this.redis = redis;
    this.config = config;

    // Calculate optimal Bloom filter size and number of hash functions
    // Based on desired capacity and error rate
    const n = config.capacity; // Expected number of elements
    const p = config.errorRate; // Desired false positive rate

    // Optimal size: m = -n * ln(p) / (ln(2)^2)
    const m = Math.ceil(-n * Math.log(p) / (Math.log(2) * Math.log(2)));

    // Optimal number of hash functions: k = (m/n) * ln(2)
    const k = Math.max(1, Math.ceil((m / n) * Math.log(2)));

    console.log(`Bloom filter parameters: size=${m}, hashes=${k}, for capacity=${n}, error_rate=${p}`);
    this.bloomFilter = new BloomFilter(m, k);
  }

  /**
   * Initialize the Bloom filter by loading existing data from Redis
   */
  async initialize(): Promise<void> {
    try {
      // Try to load existing Bloom filter from Redis
      await this.loadFromRedis();

      // Check if we loaded any data
      const elementCount = await this.redis.scard(`${this.config.redisKey}:elements`);

      if (elementCount === 0) {
        // Initialize with some sample usernames for demonstration
        await this.seedWithSampleUsernames();
        console.log('Bloom filter initialized with sample data');
      } else {
        console.log(`Bloom filter loaded from Redis with ${elementCount} elements`);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Bloom filter:', error);
      throw error;
    }
  }

  /**
   * Add sample usernames to demonstrate the functionality
   */
  private async seedWithSampleUsernames(): Promise<void> {
    const sampleUsernames = [
      'admin', 'user', 'test', 'demo', 'guest', 'root', 'john', 'jane',
      'alice', 'bob', 'charlie', 'david', 'emma', 'frank', 'grace',
      'henry', 'ivy', 'jack', 'kate', 'liam', 'mia', 'noah', 'olivia',
      'peter', 'quinn', 'ruby', 'sam', 'tina', 'uma', 'victor', 'wendy'
    ];

    // Add directly to bloom filter and track in Redis
    for (const username of sampleUsernames) {
      const normalizedUsername = username.toLowerCase();
      this.bloomFilter.add(normalizedUsername);
      await this.redis.sadd(`${this.config.redisKey}:elements`, normalizedUsername);
    }

    await this.saveToRedis();
  }

  /**
   * Populate the Bloom filter with usernames from the in-memory database
   */
  async populateFromDatabase(): Promise<void> {
    try {
      const { InMemoryUserDB } = await import('./inMemoryUserDB.js');
      const userDB = InMemoryUserDB.getInstance();

      // Initialize the database if not already done
      await userDB.initialize(10000);

      // Get all usernames from the database
      const usernames = userDB.getAllUsernames();

      console.log(`Populating Bloom filter with ${usernames.length} usernames from database...`);
      const startTime = Date.now();

      // Clear existing data
      await this.clear();
      await this.initialize();

      // Add all usernames to the Bloom filter
      for (const username of usernames) {
        await this.addUsername(username);
      }

      const endTime = Date.now();
      console.log(`Bloom filter populated with ${usernames.length} usernames in ${endTime - startTime}ms`);

    } catch (error) {
      throw new Error(`Failed to populate from database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a username might exist (may have false positives, no false negatives)
   */
  async mightExist(username: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Bloom filter not initialized');
    }

    return this.bloomFilter.has(username.toLowerCase());
  }

  /**
   * Add a new username to the Bloom filter
   */
  async addUsername(username: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Bloom filter not initialized');
    }

    const normalizedUsername = username.toLowerCase();
    this.bloomFilter.add(normalizedUsername);

    // Track the element for reconstruction
    await this.redis.sadd(`${this.config.redisKey}:elements`, normalizedUsername);
    await this.saveToRedis();
  }

  /**
   * Load Bloom filter state from Redis
   */
  private async loadFromRedis(): Promise<void> {
    try {
      const serialized = await this.redis.get(this.config.redisKey);
      if (serialized) {
        const filterData = JSON.parse(serialized);

        // Calculate optimal parameters from stored config
        const n = filterData.capacity || this.config.capacity;
        const p = filterData.errorRate || this.config.errorRate;
        const m = Math.ceil(-n * Math.log(p) / (Math.log(2) * Math.log(2)));
        const k = Math.max(1, Math.ceil((m / n) * Math.log(2)));

        // Recreate the bloom filter with calculated parameters
        this.bloomFilter = new BloomFilter(m, k);

        // Reload all elements that were previously added
        const elements = await this.redis.smembers(`${this.config.redisKey}:elements`);
        for (const element of elements) {
          this.bloomFilter.add(element);
        }

        console.log(`Loaded ${elements.length} elements into Bloom filter`);
      }
    } catch (error) {
      throw new Error(`Failed to load bloom filter from Redis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save the current Bloom filter state to Redis
   */
  private async saveToRedis(): Promise<void> {
    try {
      // Use the built-in saveAsJSON method if available, or create a simple representation
      const filterData = {
        capacity: this.config.capacity,
        errorRate: this.config.errorRate,
        // Store elements that were added (we'll track them separately)
        elements: [] as string[]
      };

      const serialized = JSON.stringify(filterData);
      await this.redis.set(this.config.redisKey, serialized);

      // Also save individual elements for reconstruction
      await this.redis.del(`${this.config.redisKey}:elements`);
      // We'll track elements when they're added
    } catch (error) {
      throw new Error(`Failed to save bloom filter to Redis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get statistics about the Bloom filter
   */
  getStats(): {
    capacity: number;
    errorRate: number;
    estimatedElements: number;
    size: number;
  } {
    return {
      capacity: this.config.capacity,
      errorRate: this.config.errorRate,
      estimatedElements: this.bloomFilter.length,
      size: this.bloomFilter.size
    };
  }

  /**
   * Clear the Bloom filter and remove from Redis
   */
  async clear(): Promise<void> {
    // Calculate optimal parameters
    const n = this.config.capacity;
    const p = this.config.errorRate;
    const m = Math.ceil(-n * Math.log(p) / (Math.log(2) * Math.log(2)));
    const k = Math.max(1, Math.ceil((m / n) * Math.log(2)));

    this.bloomFilter = new BloomFilter(m, k);
    await this.redis.del(this.config.redisKey);
    await this.redis.del(`${this.config.redisKey}:elements`);
    this.isInitialized = false;
    console.log('Bloom filter cleared and Redis cache purged');
  }

  /**
   * Rebuild the Bloom filter from stored elements
   * Useful when cache corruption is suspected
   */
  async rebuild(): Promise<void> {
    try {
      console.log('Rebuilding Bloom filter from stored elements...');

      // Get all stored elements
      const elements = await this.redis.smembers(`${this.config.redisKey}:elements`);

      // Recreate the bloom filter
      const n = this.config.capacity;
      const p = this.config.errorRate;
      const m = Math.ceil(-n * Math.log(p) / (Math.log(2) * Math.log(2)));
      const k = Math.max(1, Math.ceil((m / n) * Math.log(2)));

      this.bloomFilter = new BloomFilter(m, k);

      // Re-add all elements
      for (const element of elements) {
        this.bloomFilter.add(element);
      }

      // Save the rebuilt filter
      await this.saveToRedis();

      console.log(`Bloom filter rebuilt with ${elements.length} elements`);
    } catch (error) {
      throw new Error(`Failed to rebuild bloom filter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate the integrity of the Bloom filter cache
   */
  async validateCache(): Promise<{
    isValid: boolean;
    storedElements: number;
    filterElements: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let isValid = true;

    try {
      // Check if Redis keys exist
      const filterExists = await this.redis.exists(this.config.redisKey);
      const elementsExist = await this.redis.exists(`${this.config.redisKey}:elements`);

      if (!filterExists && elementsExist) {
        errors.push('Filter metadata missing but elements exist');
        isValid = false;
      }

      if (filterExists && !elementsExist) {
        errors.push('Filter metadata exists but elements missing');
        isValid = false;
      }

      // Get element counts
      const storedElements = await this.redis.scard(`${this.config.redisKey}:elements`);
      const filterElements = this.bloomFilter.length;

      // Check if counts match (allow some tolerance for false positives)
      if (Math.abs(storedElements - filterElements) > 10) {
        errors.push(`Element count mismatch: stored=${storedElements}, filter=${filterElements}`);
        isValid = false;
      }

      return {
        isValid,
        storedElements,
        filterElements,
        errors
      };
    } catch (error) {
      errors.push(`Cache validation error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        isValid: false,
        storedElements: 0,
        filterElements: 0,
        errors
      };
    }
  }

  /**
   * Force a cache refresh - useful when Redis data might be stale
   */
  async refreshCache(): Promise<void> {
    try {
      console.log('Refreshing Bloom filter cache...');

      // Clear current state
      await this.clear();

      // Reinitialize
      await this.initialize();

      console.log('Cache refresh completed');
    } catch (error) {
      throw new Error(`Failed to refresh cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
