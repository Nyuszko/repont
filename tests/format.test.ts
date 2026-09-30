import { describe, expect, it } from 'vitest';
import { formatFt, formatInt, formatShort } from '../src/core/format';

describe('formatInt', () => {
  it('egész számot ad vissza', () => {
    expect(formatInt(50)).toBe('50');
    expect(formatInt(0)).toBe('0');
  });
});

describe('formatShort', () => {
  it('ezer alatt nyers számot ad', () => {
    expect(formatShort(999)).toBe('999');
  });

  it('ezereket magyar ezres taggal ír', () => {
    expect(formatShort(1500)).toBe('1,5 ezer');
    expect(formatShort(25000)).toBe('25 ezer');
    expect(formatShort(999999)).toBe('1 millió');
  });

  it('milliókat és milliárdokat ír', () => {
    expect(formatShort(1234567)).toBe('1,23 millió');
    expect(formatShort(2500000000)).toBe('2,5 milliárd');
  });

  it('nem vágja le a nullákat tíz helyen', () => {
    expect(formatShort(25000)).toBe('25 ezer');
    expect(formatShort(100000)).toBe('100 ezer');
  });
});

describe('formatFt', () => {
  it('Ft utántagot ad', () => {
    expect(formatFt(50)).toBe('50 Ft');
  });

  it('millió felett rövidített formát', () => {
    expect(formatFt(2_500_000)).toBe('2,5 millió Ft');
  });
});
