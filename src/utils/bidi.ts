const RTL_ISOLATE_START = '⁧';
const POP_DIRECTIONAL_ISOLATE = '⁩';

/**
 * Wraps an Arabic (RTL) fragment in Unicode isolate marks so it doesn't
 * scramble the surrounding word order when spliced into an English (LTR)
 * sentence, e.g. `` `${isolateRTL(word)} came out clearly` ``.
 */
export function isolateRTL(text: string): string {
  return `${RTL_ISOLATE_START}${text}${POP_DIRECTIONAL_ISOLATE}`;
}
