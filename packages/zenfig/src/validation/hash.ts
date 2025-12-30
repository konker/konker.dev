import * as crypto from 'node:crypto';

function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'function') {
        return `[Function:${val.name ?? 'anonymous'}]`;
      }
      if (typeof val === 'symbol') {
        return val.toString();
      }
      if (typeof val === 'bigint') {
        return val.toString();
      }
      if (val && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      return val;
    },
    2
  );
}

export function computeHash(value: unknown): string {
  const serialized = stableStringify(value);
  return `sha256:${crypto.createHash('sha256').update(serialized).digest('hex')}`;
}
