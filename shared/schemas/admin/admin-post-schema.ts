import z from 'zod';

import { newPostSchema, userNameDisplayName, userNameMaxLength } from '../post-schema';
import { preprocessBooleanNumber, preprocessUrl } from '../schema-utilities';

/** 管理画面では Turnstile 認証は省きハンドルネームは必須入力にする */
export const adminNewPostSchema = newPostSchema.omit({ turnstile_token: true }).extend({
  user_name : z.preprocess(
                preprocessUrl,
                z.string({ error: `${userNameDisplayName}に文字列でないデータが入力されています` })
                  .min(1, { error: `${userNameDisplayName}を入力してください` })
                  .max(userNameMaxLength, { error: `${userNameDisplayName}は${userNameMaxLength}文字以内で入力してください` })
              )
});

export const adminUpdatePostSchema = adminNewPostSchema.extend({
  is_admin : z.preprocess(
              preprocessBooleanNumber,
              z.union([z.literal(0), z.literal(1)])
            )
});
