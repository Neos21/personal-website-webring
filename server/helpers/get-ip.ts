import type { Context } from 'hono';

export const getIp = (context: Context): string => context.req.header('CF-Connecting-IP') ?? context.req.header('X-Real-IP') ?? 'Unknown';
