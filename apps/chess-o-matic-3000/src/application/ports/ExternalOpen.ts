import type { ExternalOpenRequest } from '../types/export';

export type ExternalOpen = {
  readonly openChessDotCom: (request: ExternalOpenRequest) => Promise<void>;
  readonly openLichess: (request: ExternalOpenRequest) => Promise<void>;
};
