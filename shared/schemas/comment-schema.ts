import z from 'zod';

import { reduceNewlines } from '../helpers/reduce-newlines';

export const userNameDisplayName = 'ハンドルネーム';
export const userNameMaxLength   = 50;
export const commentDisplayName  = 'コメント';
export const commentMaxLength    = 500;

export const newSiteCommentSchema = z.object({
  user_name : z.preprocess(
                value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                z.string({ error: `${userNameDisplayName}に文字列でないデータが入力されています` })
                  .max(userNameMaxLength, { error: `${userNameDisplayName}は${userNameMaxLength}文字以内で入力してください` })
                  .nullable()
              ),
  content   : z.preprocess(
                value => value == null ? '' : typeof value === 'string' ? reduceNewlines(value.trim()) : value,
                z.string({ error: `${commentDisplayName}に文字列でないデータが入力されています` })
                  .min(1, { error: `${commentDisplayName}を入力してください` })
                  .max(commentMaxLength, { error: `${commentDisplayName}は${commentMaxLength}文字以内で入力してください` })
              )
});
