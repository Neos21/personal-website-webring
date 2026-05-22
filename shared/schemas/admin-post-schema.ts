import z from 'zod';

import { reduceNewlines } from '../helpers/reduce-newlines';

export const adminPostContentDisplayName = '本文';
export const adminPostContentMaxLength = 500;

export const newAdminPostSchema = z.object({
  site_id: z.coerce.number({ error: 'サイトID 数値が指定されていません' })
    .int({ error: 'サイトID に整数が指定されていません' })
    .min(1, { error: 'サイトID に1以上の整数が指定されていません' })
    .nullish(),
  content: z.preprocess(
    value => value == null ? '' : typeof value === 'string' ? reduceNewlines(value.trim()) : value,
    z.string({ error: `${adminPostContentDisplayName}に文字列でないデータが入力されています` })
      .min(1, { error: `${adminPostContentDisplayName}を入力してください` })
      .max(adminPostContentMaxLength, { error: `${adminPostContentDisplayName}は${adminPostContentMaxLength}文字以内で入力してください` })
  )
});
