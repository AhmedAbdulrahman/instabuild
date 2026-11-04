/**
 * Reads the verification result an agent reports in its output.
 *
 * Agents are asked to end verification with `<verification>passed</verification>`
 * or `<verification>failed</verification>`. A Feature may only become Verified
 * when the agent explicitly reports `passed`.
 */

export type VerificationResult = 'passed' | 'failed' | 'missing';

export type CompletionStatus = 'verified' | 'waiting_approval';

/**
 * Appended after the (user-customizable) verification instructions, so a custom
 * prompt can never drop the report the server depends on.
 */
export const VERIFICATION_REPORT_INSTRUCTIONS = `## Verification Result (REQUIRED)

After verifying, report the result on its own line, exactly one of:

<verification>passed</verification>
<verification>failed</verification>

Report passed only if the verification test actually ran and passed. If you could not run it, report failed. The feature is only marked verified when you report passed.`;

const VERIFICATION_TAG = /<verification>\s*([^<]*?)\s*<\/verification>/gi;

const NOT_VERIFIED_REASONS: Record<Exclude<VerificationResult, 'passed'>, string> = {
  failed: 'verification failed',
  missing: 'agent did not report a verification result',
};

/** Returns the last reported result, since agents may fix and re-run failing tests */
export function readVerificationResult(agentOutput: string): VerificationResult {
  const reports = [...agentOutput.matchAll(VERIFICATION_TAG)];
  const last = reports.at(-1)?.[1].toLowerCase();
  return last === 'passed' || last === 'failed' ? last : 'missing';
}

/** The verification instructions plus the report the server reads */
export function buildVerificationInstructions(playwrightVerificationInstructions: string): string {
  return `${playwrightVerificationInstructions}\n\n${VERIFICATION_REPORT_INSTRUCTIONS}`;
}

/**
 * Status for a finished Run: Verified only when the agent reported passing
 * verification; otherwise a human must review it.
 */
export function resolveCompletionStatus(
  skipTests: boolean | undefined,
  agentOutput: string
): { status: CompletionStatus; notVerifiedReason?: string } {
  if (skipTests) return { status: 'waiting_approval' };
  const result = readVerificationResult(agentOutput);
  if (result === 'passed') return { status: 'verified' };
  return { status: 'waiting_approval', notVerifiedReason: NOT_VERIFIED_REASONS[result] };
}
