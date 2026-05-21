import type { ZodError } from 'zod';

export const mergeIssues = (zodError: ZodError): string => zodError.issues.map(issue => issue.message).join('・');
