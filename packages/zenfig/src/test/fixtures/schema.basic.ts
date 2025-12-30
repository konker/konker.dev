import { Type } from '@sinclair/typebox';

export const ConfigSchema = Type.Object({
  database: Type.Object({
    host: Type.String(),
    port: Type.Integer({ minimum: 1, maximum: 65535 }),
    url: Type.String({ format: 'uri' }),
  }),
  api: Type.Object({
    timeout: Type.Integer({ minimum: 1 }),
  }),
  feature: Type.Object({
    enableBeta: Type.Boolean({ default: false }),
  }),
  tags: Type.Array(Type.String()),
});
