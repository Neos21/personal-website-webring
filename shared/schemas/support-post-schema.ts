import z from 'zod';

import { reduceNewlines } from '../helpers/reduce-newlines';

const siteIdDisplayName   = 'サイト ID';
const userNameDisplayName = 'ハンドルネーム';
const userNameMaxLength   = 100;
const commentDisplayName  = '本文';
const commentMaxLength    = 500;

export const supportPostSchema = z.object({
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
                      z.string({ error: `${commentDisplayName}に文字列でないデータが入力されています` })
                        .min(1, { error: `${commentDisplayName}を入力してください` })
                        .max(commentMaxLength, { error: `${commentDisplayName}は${commentMaxLength}文字以内で入力してください` })
                    ),
  turnstile_token : z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                      z.string({ error: 'Turnstile 認証を行ってください' })
                        .min(1, { error: 'Turnstile 認証を行ってください' })
                    )
});
