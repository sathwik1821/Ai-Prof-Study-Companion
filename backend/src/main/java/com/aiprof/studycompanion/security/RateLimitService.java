package com.aiprof.studycompanion.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe Token Bucket rate limiter for protecting expensive AI endpoints
 * against quota exhaustion and abusive request bursts.
 */
@Service
public class RateLimitService {

    private static class Bucket {
        double tokens;
        long lastRefillTimestamp;

        Bucket(double maxCapacity) {
            this.tokens = maxCapacity;
            this.lastRefillTimestamp = Instant.now().toEpochMilli();
        }
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Checks if a request can consume tokens from the bucket.
     * @param key unique bucket key (e.g. "userId:tutor" or "ip:quiz")
     * @param tokensToConsume tokens requested
     * @param maxCapacity bucket capacity
     * @param refillTokensPerSecond tokens replenished per second
     * @return true if consumed, false if rate limited
     */
    public synchronized boolean tryAcquire(String key, double tokensToConsume, double maxCapacity, double refillTokensPerSecond) {
        long now = Instant.now().toEpochMilli();
        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(maxCapacity));

        double secondsElapsed = (now - bucket.lastRefillTimestamp) / 1000.0;
        bucket.tokens = Math.min(maxCapacity, bucket.tokens + (secondsElapsed * refillTokensPerSecond));
        bucket.lastRefillTimestamp = now;

        if (bucket.tokens >= tokensToConsume) {
            bucket.tokens -= tokensToConsume;
            return true;
        }
        return false;
    }

    public synchronized int getRetryAfterSeconds(String key, double tokensNeeded, double refillTokensPerSecond) {
        Bucket bucket = buckets.get(key);
        if (bucket == null) return 1;
        double deficit = tokensNeeded - bucket.tokens;
        if (deficit <= 0) return 1;
        return (int) Math.ceil(deficit / refillTokensPerSecond);
    }
}
