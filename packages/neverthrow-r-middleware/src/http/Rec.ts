export type Rec = Record<string, unknown>;

export type BodyRec = Record<string, unknown> & { readonly body?: unknown };

export type StrBodyRec = Record<string, unknown> & { readonly body?: string };
