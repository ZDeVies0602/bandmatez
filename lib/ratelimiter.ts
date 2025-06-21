// Simple in-memory rate limiter
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute by default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async consume(key: string): Promise<void> {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // First request or window has reset
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return;
    }

    if (record.count >= this.maxRequests) {
      // Rate limit exceeded
      const msBeforeNext = record.resetTime - now;
      const error = new Error('Rate limit exceeded') as any;
      error.msBeforeNext = msBeforeNext;
      throw error;
    }

    // Increment count
    record.count++;
    this.requests.set(key, record);
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Clean up expired entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

export default rateLimiter; 