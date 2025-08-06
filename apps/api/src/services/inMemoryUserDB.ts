import { randomBytes } from 'crypto';

export interface User {
  username: string;
  password: string; // In production, this would be hashed
  email?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export class InMemoryUserDB {
  private static instance: InMemoryUserDB;
  private users: Map<string, User> = new Map();
  private initialized = false;

  static getInstance(): InMemoryUserDB {
    if (!InMemoryUserDB.instance) {
      InMemoryUserDB.instance = new InMemoryUserDB();
    }
    return InMemoryUserDB.instance;
  }

  /**
   * Initialize the database with random users
   */
  async initialize(userCount: number = 10000): Promise<void> {
    if (this.initialized) {
      console.log(`Database already initialized with ${this.users.size} users`);
      return;
    }

    console.log(`Initializing in-memory database with ${userCount} random users...`);
    const startTime = Date.now();

    // Generate random usernames and passwords
    for (let i = 0; i < userCount; i++) {
      const username = this.generateRandomUsername();
      const password = this.generateRandomPassword();
      const email = `${username}@example.com`;

      const user: User = {
        username,
        password,
        email,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
      };

      // Randomly assign lastLogin for some users
      if (Math.random() > 0.3) {
        user.lastLogin = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      }

      this.users.set(username.toLowerCase(), user);
    }

    const endTime = Date.now();
    this.initialized = true;

    console.log(`Database initialized with ${this.users.size} users in ${endTime - startTime}ms`);
  }

  /**
   * Generate a random username
   */
  private generateRandomUsername(): string {
    const prefixes = ['user', 'test', 'demo', 'admin', 'guest', 'member', 'player', 'customer'];
    const suffixes = ['123', '456', '789', 'xyz', 'abc', 'pro', 'dev', 'app'];
    const adjectives = ['fast', 'cool', 'smart', 'super', 'mega', 'ultra', 'prime', 'elite'];
    const nouns = ['cat', 'dog', 'bird', 'fish', 'lion', 'tiger', 'bear', 'wolf'];

    const randomType = Math.floor(Math.random() * 4);

    switch (randomType) {
      case 0:
        // prefix + random number
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(Math.random() * 9999)}`;
      case 1:
        // adjective + noun
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
      case 2:
        // random string + suffix
        return `${this.generateRandomString(5)}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
      default:
        // fully random
        return this.generateRandomString(8);
    }
  }

  /**
   * Generate a random password
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Generate a random string
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if a username exists
   */
  userExists(username: string): boolean {
    return this.users.has(username.toLowerCase());
  }

  /**
   * Get a user by username
   */
  getUser(username: string): User | undefined {
    return this.users.get(username.toLowerCase());
  }

  /**
   * Authenticate a user
   */
  authenticate(username: string, password: string): User | null {
    const user = this.users.get(username.toLowerCase());
    if (user && user.password === password) {
      // Update last login
      user.lastLogin = new Date();
      return user;
    }
    return null;
  }

  /**
   * Add a new user
   */
  addUser(username: string, password: string, email?: string): boolean {
    const normalizedUsername = username.toLowerCase();

    if (this.users.has(normalizedUsername)) {
      return false; // User already exists
    }

    const user: User = {
      username: normalizedUsername,
      password,
      email: email || `${normalizedUsername}@example.com`,
      createdAt: new Date()
    };

    this.users.set(normalizedUsername, user);
    return true;
  }

  /**
   * Remove a user
   */
  removeUser(username: string): boolean {
    return this.users.delete(username.toLowerCase());
  }

  /**
   * Get all usernames (for populating Bloom filter)
   */
  getAllUsernames(): string[] {
    return Array.from(this.users.keys());
  }

  /**
   * Get all users (for admin dashboard)
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalUsers: number;
    usersWithLastLogin: number;
    averageUsernameLength: number;
    memoryUsage: number;
  } {
    const usernames = Array.from(this.users.keys());
    const usersWithLastLogin = Array.from(this.users.values()).filter(u => u.lastLogin).length;
    const averageUsernameLength = usernames.reduce((sum, username) => sum + username.length, 0) / usernames.length;

    // Rough memory calculation
    const memoryUsage = JSON.stringify(Array.from(this.users.values())).length * 2; // Rough estimate in bytes

    return {
      totalUsers: this.users.size,
      usersWithLastLogin,
      averageUsernameLength: Math.round(averageUsernameLength * 100) / 100,
      memoryUsage
    };
  }

  /**
   * Clear all users
   */
  clear(): void {
    this.users.clear();
    this.initialized = false;
    console.log('In-memory database cleared');
  }

  /**
   * Get a random sample of usernames for testing
   */
  getRandomUsernames(count: number): string[] {
    const usernames = Array.from(this.users.keys());
    const shuffled = usernames.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, usernames.length));
  }
}
