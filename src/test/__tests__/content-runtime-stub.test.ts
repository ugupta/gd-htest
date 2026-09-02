import { describe, expect, it } from 'vitest';

describe('content-runtime stub', () => {
  it('throws a directive error naming the mock call when imported', async () => {
    await expect(import('../content-runtime-stub')).rejects.toThrow(
      /vi\.mock\('virtual:content-runtime'/,
    );
  });

  it('names the module it stands in for, so the failure is self-explaining', async () => {
    await expect(import('../content-runtime-stub')).rejects.toThrow(/virtual:content-runtime/);
  });
});
