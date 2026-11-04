import { describe, it, expect } from 'vitest';
import { readVerificationResult } from '@/lib/verification-result.js';

describe('verification-result.ts', () => {
  describe('readVerificationResult', () => {
    it('returns passed when the agent reports passing verification', () => {
      const output = 'Ran the tests.\n<verification>passed</verification>\n<summary>Done</summary>';
      expect(readVerificationResult(output)).toBe('passed');
    });

    it('returns failed when the agent reports failing verification', () => {
      expect(readVerificationResult('<verification>failed</verification>')).toBe('failed');
    });

    it('returns missing when the agent reports nothing', () => {
      expect(readVerificationResult('🔧 Tool: Edit\nAll good, tests pass!')).toBe('missing');
    });

    it('returns missing for an unknown result value', () => {
      expect(readVerificationResult('<verification>mostly passed</verification>')).toBe('missing');
    });

    it('ignores case and surrounding whitespace', () => {
      expect(readVerificationResult('<verification>\n  PASSED \n</verification>')).toBe('passed');
    });

    it('uses the last report when the agent retried', () => {
      const failedThenPassed =
        '<verification>failed</verification>\nFixed it.\n<verification>passed</verification>';
      const passedThenFailed =
        '<verification>passed</verification>\nBroke it.\n<verification>failed</verification>';
      expect(readVerificationResult(failedThenPassed)).toBe('passed');
      expect(readVerificationResult(passedThenFailed)).toBe('failed');
    });
  });
});
