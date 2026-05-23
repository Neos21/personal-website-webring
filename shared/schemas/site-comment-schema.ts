import z from 'zod';

import { preprocessMultiLinesString, preprocessOneLineString, propertyTurnstileToken } from './schema-utilities';

export const userNameDisplayName = 'ハンドルネーム' as const;
export const userNameMaxLength   = 50               as const;
export const commentDisplayName  = 'コメント'       as const;
export const commentMaxLength    = 500              as const;

export const newSiteCommentSchema = z.object({
  user_name       : z.preprocess(
                      preprocessOneLineString,
                      z.string({ error: `${userNameDisplayName}に文字列でないデータが入力されています` })
                        .max(userNameMaxLength, { error: `${userNameDisplayName}は${userNameMaxLength}文字以内で入力してください` })
                        .nullish()  // null・undefined
                    ),
  content         : z.preprocess(
                      preprocessMultiLinesString,
                      z.string({ error: `${commentDisplayName}に文字列でないデータが入力されています` })
                        .min(1, { error: `${commentDisplayName}を入力してください` })
                        .max(commentMaxLength, { error: `${commentDisplayName}は${commentMaxLength}文字以内で入力してください` })
                    ),
  turnstile_token : propertyTurnstileToken
});
