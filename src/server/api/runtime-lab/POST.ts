import type { Request, Response } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import os from 'node:os';
import { performance } from 'node:perf_hooks';

const CACHE_VALUE_BYTES = 10 * 1024 * 1024;
const cache = new Map<string, string>();
const runtimeInstanceId = randomUUID();

function addCacheEntries(key: string, blocks: number) {
  let entriesAdded = 0;
  let valuePreview = '';

  for (let index = 0; index < blocks; index += 1) {
    const entryKey = blocks === 1 ? key : `${key}:${index + 1}`;
    if (!cache.has(entryKey)) {
      cache.set(entryKey, randomBytes(CACHE_VALUE_BYTES / 2).toString('hex'));
      entriesAdded += 1;
    }
    if (!valuePreview) valuePreview = `${cache.get(entryKey)!.slice(0, 64)}…`;
  }

  return {
    key,
    requestedBlocks: blocks,
    entriesAdded,
    valuePreview,
    entrySizeBytes: CACHE_VALUE_BYTES,
    entryCount: cache.size,
    approximateCacheBytes: cache.size * CACHE_VALUE_BYTES,
    runtimeInstanceId,
  };
}

function generatePrimes(count: number) {
  const primes: number[] = [];
  let candidate = 2;
  while (primes.length < count) {
    let isPrime = true;
    const limit = Math.sqrt(candidate);
    for (const prime of primes) {
      if (prime > limit) break;
      if (candidate % prime === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(candidate);
    candidate = candidate === 2 ? 3 : candidate + 2;
  }
  return primes;
}

export default async function handler(req: Request, res: Response) {
  const { action, key, blocks, count } = req.body as {
    action?: string;
    key?: unknown;
    blocks?: unknown;
    count?: unknown;
  };

  if (action === 'environment') {
    res.json(Object.fromEntries(Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b))));
    return;
  }

  if (action === 'system') {
    const cpus = os.cpus();
    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      architecture: os.arch(),
      nodeVersion: process.version,
      processId: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model ?? 'unknown',
      loadAverage: os.loadavg(),
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem(),
      processMemoryBytes: process.memoryUsage(),
      runtimeInstanceId,
    });
    return;
  }

  if (action === 'cache') {
    const cacheKey = typeof key === 'string' ? key.trim() : '';
    const requestedBlocks = Number(blocks ?? 1);
    if (!cacheKey) {
      res.status(400).json({ error: 'Key is required.' });
      return;
    }
    if (!Number.isSafeInteger(requestedBlocks) || requestedBlocks < 1) {
      res.status(400).json({ error: 'Blocks must be a positive integer.' });
      return;
    }
    res.json(addCacheEntries(cacheKey, requestedBlocks));
    return;
  }

  if (action === 'primes') {
    const requested = Number(count);
    if (!Number.isSafeInteger(requested) || requested < 1) {
      res.status(400).json({ error: 'N must be a positive integer.' });
      return;
    }
    const startedAt = performance.now();
    const primes = generatePrimes(requested);
    res.json({
      count: primes.length,
      durationMs: Math.round(performance.now() - startedAt),
      largestPrime: primes.at(-1),
      firstTen: primes.slice(0, 10),
      lastTen: primes.slice(-10),
    });
    return;
  }

  res.status(400).json({ error: 'Unknown diagnostic action.' });
}
