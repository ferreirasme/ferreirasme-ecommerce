import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const rateLimiters = new Map<string, Map<string, number[]>>();

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    uniqueTokenPerInterval = 10,
    interval = 60000, // 1 minute
  } = options;

  const now = Date.now();
  const windowStart = now - interval;

  if (!rateLimiters.has(identifier)) {
    rateLimiters.set(identifier, new Map());
  }

  const userLimiter = rateLimiters.get(identifier)!;
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 
             'unknown';

  const requests = userLimiter.get(ip) || [];
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= uniqueTokenPerInterval) {
    return {
      success: false,
      limit: uniqueTokenPerInterval,
      remaining: 0,
      reset: windowStart + interval,
    };
  }

  recentRequests.push(now);
  userLimiter.set(ip, recentRequests);

  return {
    success: true,
    limit: uniqueTokenPerInterval,
    remaining: uniqueTokenPerInterval - recentRequests.length,
    reset: windowStart + interval,
  };
}

export function createRateLimitResponse(result: RateLimitResult) {
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers }
    );
  }

  return null;
}