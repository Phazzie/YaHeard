import { KVLimiter } from 'sveltekit-rate-limiter/server';
import { error } from '@sveltejs/kit';

// Create a rate limiter that allows 10 requests per minute.
// This will be used for general API requests.
export const limiter = new KVLimiter({
  rates: {
    ip: [10, 'm'],
  },
  onRateLimited: () => {
    throw error(429, 'Too many requests');
  }
});

// Create a stricter rate limiter for sensitive actions like job creation.
// This allows 2 requests per minute.
export const strictLimiter = new KVLimiter({
    rates: {
        ip: [2, 'm'],
    },
    onRateLimited: () => {
        throw error(429, 'Too many requests on this endpoint. Please try again later.');
    }
});
