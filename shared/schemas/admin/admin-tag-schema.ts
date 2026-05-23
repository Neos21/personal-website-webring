import z from 'zod';

import { preprocessOneLineString } from '../schema-utilities';
import { tagDisplayName, tagMaxLength } from '../site-schema';

export const tagNameSchema = z.preprocess(
  preprocessOneLineString,
  z.string({ error: `${tagDisplayName}に文字列でないデータが入力されています` })
    .min(1, { error: `${tagDisplayName}を入力してください` })
    .max(tagMaxLength, { error: `${tagDisplayName}は文字以内で入力してください` })
);

export const adminNewTagSchema = z.object({
  name: tagNameSchema
});
