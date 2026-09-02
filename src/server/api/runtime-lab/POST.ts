import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import os from 'node:os';

const cache = new Map<string, string>();
const ENTRY_BYTES = 10 * 1024;
const MAX_CACHE_ENTRIES = 100;
const MAX_PRIME_COUNT = 10_000_000;

function cacheSize(): number {
  return cache.size * ENTRY_BYTES;
}

function primes(count: number): number[] {
  const result: number[] = [];
  let candidate = 2;
  while (result.length < count) {
    let isPrime = true;
    for (let i = 2; i * i <= candidate; i += 1) {
      if (candidate % i === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) result.push(candidate);
    candidate += 1;
  }
  return result;
}

export default async function handler(req: Request, res: Response) {
  const { action, key, count } = req.body as { action?: string; key?: string; count?: unknown };

  if (action === 'environment') {
    const visible = Object.entries(process.env)
      .filter(([name]) => ['NODE_ENV', 'PORT', 'HOSTNAME', 'TZ'].includes(name))
      .reduce<Record<string, string>>((acc, [name, value]) => {
        acc[name] = value ?? '';
        return acc;
      }, {});
    res.json({ environment: visible, note: 'Only non-sensitive runtime settings are available.' });
    return;
  }

  if (action === 'system') {
    res.json({
      hostname: os.hostname(),
      os: `${os.type()} ${os.release()}`,
      architecture: os.arch(),
      runtime: process.version,
      processId: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      cpus: os.cpus().map((cpu) => ({ model: cpu.model, speedMHz: cpu.speed })),
      loadAverage: os.loadavg(),
      memory: { totalBytes: os.totalmem(), freeBytes: os.freemem(), process: process.memoryUsage() },
    });
    return;
  }

  if (action === 'cache') {
    if (!key || !/^[a-zA-Z0-9:_-]{1,80}$/.test(key)) {
      res.status(400).json({ error: 'Use a cache key of 1–80 letters, numbers, colons, underscores, or hyphens.' });
      return;
    }
    const existed = cache.has(key);
    if (!existed && cache.size >= MAX_CACHE_ENTRIES) {
      res.status(429).json({ error: 'The diagnostic cache is full. Restart the server to clear its process-local entries.' });
      return;
    }
    if (!existed) cache.set(key, randomBytes(ENTRY_BYTES * 0.75).toString('base64'));
    const value = cache.get(key)!;
    res.json({ key, preview: `${value.slice(0, 24)}…`, entryCount: cache.size, entrySizeBytes: ENTRY_BYTES, approximateTotalBytes: cacheSize(), alreadyExisted: existed });
    return;
  }

  if (action === 'primes') {
    const requested = typeof count === 'number' ? count : Number(count);
    if (!Number.isInteger(requested) || requested < 1) {
      res.status(400).json({ error: 'Enter a positive whole number.' });
      return;
    }
    if (requested > MAX_PRIME_COUNT) {
      res.status(400).json({ error: `For service reliability, this lab supports up to ${MAX_PRIME_COUNT.toLocaleString()} primes per request.` });
      return;
    }
    const started = performance.now();
    const result = primes(requested);
    res.json({ count: result.length, durationMs: Math.round(performance.now() - started), largestPrime: result.at(-1), first10: result.slice(0, 10), last10: result.slice(-10) });
    return;
  }

  res.status(400).json({ error: 'Unknown diagnostic action.' });
}
