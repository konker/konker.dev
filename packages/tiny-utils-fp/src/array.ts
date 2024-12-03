export function stringToUint8Array(s: string | Buffer): Uint8Array {
  return new TextEncoder().encode(String(s));
}

export function arrayBufferToString(a: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(a);
}
