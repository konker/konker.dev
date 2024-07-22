export type WithPossibleHeaders = { headers?: Record<string, string | undefined> | undefined };
export type WithPossibleOutputHeaders = { headers?: Record<string, string> };
export type WithHeaders = { headers: Record<string, string> };
export type WithNormalizedHeaders = {
  normalizedHeaders: Record<string, string | undefined>;
};
