export function sanitizeRecord(record?: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [k, v ?? '']));
}
