import z from 'zod';
import { tagDisplayName, tagMaxLength } from '../site-schema';
import { preprocessOneLineString } from '../schema-utilities';

export const tagNameSchema = z.preprocess(
  preprocessOneLineString,
  z.string({ error: `${tagDisplayName}に文字列でないデータが入力されています` })
    .min(1, { error: `${tagDisplayName}を入力してください` })
    .max(tagMaxLength, { error: `${tagDisplayName}は文字以内で入力してください` })
);

export const newTagSchema = z.object({
  name: tagNameSchema
});
