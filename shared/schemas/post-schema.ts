import z from 'zod';

import { reduceNewlines } from '../helpers/reduce-newlines';

export const siteIdDisplayName   = 'サイト ID';
export const userNameDisplayName = 'ハンドルネーム';
export const userNameMaxLength   = 50;
export const contentDisplayName  = '本文';
export const contentMaxLength    = 500;

export const newPostSchema = z.object({
  site_id         : z.coerce.number({ error: `${siteIdDisplayName} 数値が指定されていません` })
                      .int({ error: `${siteIdDisplayName} に整数が指定されていません` })
                      .min(1, { error: `${siteIdDisplayName} に1以上の整数が指定されていません` })
                      .nullish(),
  user_name       : z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                      z.string({ error: `${userNameDisplayName}に文字列でないデータが入力されています` })
                        .max(userNameMaxLength, { error: `${userNameDisplayName}は${userNameMaxLength}文字以内で入力してください` })
                        .nullable()
                    ),
  content         : z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? reduceNewlines(value.trim()) : value,
                      z.string({ error: `${contentDisplayName}に文字列でないデータが入力されています` })
                        .min(1, { error: `${contentDisplayName}を入力してください` })
                        .max(contentMaxLength, { error: `${contentDisplayName}は${contentMaxLength}文字以内で入力してください` })
                    ),
  turnstile_token : z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                      z.string({ error: 'Turnstile 認証を行ってください' })
                        .min(1, { error: 'Turnstile 認証を行ってください' })
                    )
});
