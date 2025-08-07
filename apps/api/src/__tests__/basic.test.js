/**
 * Basic API Tests
 * Simple test to verify Jest is working correctly
 */

describe('Basic API Tests', () => {
  beforeAll(() => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = 'redis://localhost:6379/15';
    process.env.LOG_LEVEL = 'error';
  });

  describe('Test Environment', () => {
    it('should be in test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have Redis test URL configured', () => {
      expect(process.env.REDIS_URL).toBe('redis://localhost:6379/15');
    });

    it('should perform basic arithmetic', () => {
      expect(2 + 2).toBe(4);
      expect(10 * 5).toBe(50);
    });
  });

  describe('Array and Object Tests', () => {
    it('should handle arrays correctly', () => {
      const testArray = [1, 2, 3, 4, 5];
      expect(testArray).toHaveLength(5);
      expect(testArray).toContain(3);
      expect(testArray[0]).toBe(1);
    });

    it('should handle objects correctly', () => {
      const testObject = {
        name: 'test',
        value: 42,
        active: true
      };

      expect(testObject).toHaveProperty('name', 'test');
      expect(testObject).toHaveProperty('value', 42);
      expect(testObject).toHaveProperty('active', true);
    });
  });

  describe('Async Operations', () => {
    it('should handle promises', async () => {
      const promise = Promise.resolve('success');
      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle async functions', async () => {
      const asyncFunc = async () => {
        return new Promise(resolve => setTimeout(() => resolve('async-result'), 100));
      };

      const result = await asyncFunc();
      expect(result).toBe('async-result');
    });
  });

  describe('Error Handling', () => {
    it('should catch thrown errors', () => {
      const errorFunc = () => {
        throw new Error('Test error');
      };

      expect(errorFunc).toThrow('Test error');
    });

    it('should handle async errors', async () => {
      const asyncErrorFunc = async () => {
        throw new Error('Async error');
      };

      await expect(asyncErrorFunc()).rejects.toThrow('Async error');
    });
  });
});
