import { describe, expect, it } from 'vitest';

describe('smoke', () => {
  it('toolchain is alive', () => {
    expect(1 + 1).toBe(2);
  });
});
