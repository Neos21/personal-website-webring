import z from 'zod';

import { preprocessMultiLinesString, preprocessUrl, propertyTurnstileToken } from './schema-utilities';

export const siteIdDisplayName   = 'サイト ID'      as const;
export const userNameDisplayName = 'ハンドルネーム' as const;
export const userNameMaxLength   = 50               as const;
export const contentDisplayName  = '本文'           as const;
export const contentMaxLength    = 500              as const;

export const newPostSchema = z.object({
  site_id         : z.coerce.number({ error: `${siteIdDisplayName} に数値が指定されていません` })
                      .int({ error: `${siteIdDisplayName} に整数が指定されていません` })
                      .min(1, { error: `${siteIdDisplayName} に1以上の整数が指定されていません` })
                      .nullish(),
  user_name       : z.preprocess(
                      preprocessUrl,
                      z.string({ error: `${userNameDisplayName}に文字列でないデータが入力されています` })
                        .max(userNameMaxLength, { error: `${userNameDisplayName}は${userNameMaxLength}文字以内で入力してください` })
                        .nullish()  // null・undefined
                    ),
  content         : z.preprocess(
                      preprocessMultiLinesString,
                      z.string({ error: `${contentDisplayName}に文字列でないデータが入力されています` })
                        .min(1, { error: `${contentDisplayName}を入力してください` })
                        .max(contentMaxLength, { error: `${contentDisplayName}は${contentMaxLength}文字以内で入力してください` })
                    ),
  turnstile_token : propertyTurnstileToken
});
