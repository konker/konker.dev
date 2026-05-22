export type Rec = Record<string, unknown>;

type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : symbol extends K ? never : K;
}[keyof T];

export type Override<T, U> = Omit<T, KnownKeys<U>> & U;

export type BodyRec = Record<string, unknown> & { readonly body?: unknown };

export type StrBodyRec = Record<string, unknown> & { readonly body?: string };
