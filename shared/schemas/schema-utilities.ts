import z from 'zod';
import { reduceNewlines } from '../helpers/reduce-newlines';

export const preprocessOneLineString    = (value: unknown): unknown => value == null ? '' : typeof value === 'string' ? value.trim()                 : value;
export const preprocessMultiLinesString = (value: unknown): unknown => value == null ? '' : typeof value === 'string' ? reduceNewlines(value.trim()) : value;

export const preprocessBooleanNumber = (value: unknown): unknown => {
  if(typeof value === 'number') return value;
  if(typeof value === 'boolean') return value ? 1 : 0;
  if(typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if(['1', 'true' ].includes(normalized)) return 1;
    if(['0', 'false'].includes(normalized)) return 0;
    return value;
  }
  return value;
};

export const propertyTurnstileToken = z.preprocess(
  preprocessOneLineString,
  z.string({ error: 'Turnstile 認証を行ってください' })
    .min(1, { error: 'Turnstile 認証を行ってください' })
);
