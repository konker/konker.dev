export function normalizeInput(input: string): string {
  return input.replace(/\s+/g, '').trim();
}
