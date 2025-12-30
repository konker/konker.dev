import { z } from 'zod';

export const ConfigSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number().int().min(1).max(65535),
    url: z.string(),
  }),
  api: z.object({
    timeout: z.number().int().min(1),
  }),
  feature: z.object({
    enableBeta: z.boolean(),
  }),
  tags: z.array(z.string()),
});
