import { defineQueries, defineQuery } from '@rocicorp/zero';
import { z } from 'zod';

import { builder } from './schema.js';

// --------------------------------------------------------------------------
const idValidator = z.string();

/**
 * Synced queries. The same definitions run on the client (to subscribe) and on
 * the backend `/zero/query` endpoint (to authorize/transform). `ctx` is the
 * authenticated user (or undefined for anonymous reads).
 */
export const queries = defineQueries({
  allWidgets: defineQuery(() => builder.widgets.orderBy('name', 'asc')),
  widgetById: defineQuery(idValidator, ({ args }) => builder.widgets.where('id', args).one()),
});
