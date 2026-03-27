import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { auth } from '../lib/better-auth.js'; // path to your auth file

export const app = new Hono()
  .use('*', logger())
  .use(
    '*',
    cors({
      origin: 'http://localhost:3002', // Your frontend URL
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: true, // Required for better-auth cookies
    })
  )
  // .get('/open-api', async (c) => c.json(await auth.api.generateOpenAPISchema()))
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
