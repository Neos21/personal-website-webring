import z from 'zod';

import { newPostSchema, userNameDisplayName, userNameMaxLength } from '../post-schema';
import { preprocessOneLineString } from '../schema-utilities';

/** 管理画面では Turnstile 認証は省きハンドルネームは必須入力にする */
export const newAdminPostSchema = newPostSchema.omit({ turnstile_token: true }).extend({
  user_name : z.preprocess(
                preprocessOneLineString,
                z.string({ error: `${userNameDisplayName}に文字列でないデータが入力されています` })
                  .min(1, { error: `${userNameDisplayName}を入力してください` })
                  .max(userNameMaxLength, { error: `${userNameDisplayName}は${userNameMaxLength}文字以内で入力してください` })
              )
});
