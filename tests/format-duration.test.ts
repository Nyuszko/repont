import { describe, expect, it } from 'vitest';
import { formatDuration } from '../src/ui/settings-panel';

describe('formatDuration', () => {
  it('nulla esetén másodpercet ad', () => {
    expect(formatDuration(0)).toBe('0 mp');
    expect(formatDuration(-5)).toBe('0 mp');
  });

  it('45 mp alatt csak másdpercet ad', () => {
    expect(formatDuration(45)).toBe('45 mp');
  });

  it('perceket ír', () => {
    expect(formatDuration(125)).toBe('2 perc 5 mp');
  });

  it('órákat ír', () => {
    expect(formatDuration(3725)).toBe('1 óra 2 perc');
    expect(formatDuration(7200)).toBe('2 óra 0 perc');
  });
});
