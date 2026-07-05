/* eslint-disable fp/no-nil, fp/no-unused-expression */
import { defineMutator, defineMutators } from '@rocicorp/zero';
import { z } from 'zod';

import { assertIsLoggedIn } from './auth.js';

// --------------------------------------------------------------------------
const widgetCreateArgs = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
});

const widgetUpdateArgs = z.object({
  id: z.string(),
  name: z.string().optional(),
  size: z.number().optional(),
});

const widgetDeleteArgs = z.object({
  id: z.string(),
});

/**
 * Custom mutators. The fn runs optimistically on the client and authoritatively
 * on the backend `/zero/mutate` endpoint (where `tx` is a server transaction).
 * All require a logged-in user.
 */
export const mutators = defineMutators({
  widget: {
    create: defineMutator(widgetCreateArgs, async ({ args, ctx, tx }) => {
      assertIsLoggedIn(ctx);
      await tx.mutate.widgets.insert(args);
    }),
    update: defineMutator(widgetUpdateArgs, async ({ args, ctx, tx }) => {
      assertIsLoggedIn(ctx);
      await tx.mutate.widgets.update(args);
    }),
    delete: defineMutator(widgetDeleteArgs, async ({ args, ctx, tx }) => {
      assertIsLoggedIn(ctx);
      await tx.mutate.widgets.delete({ id: args.id });
    }),
  },
});
