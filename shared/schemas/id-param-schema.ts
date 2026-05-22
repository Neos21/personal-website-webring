import z from 'zod';

export const idParamSchema = z.coerce.number({ error: 'ID に数値が指定されていません' })
  .int({ error: 'ID に整数が指定されていません' })
  .min(1, { error: 'ID に1以上の整数が指定されていません' });
