import z from 'zod';

import { preprocessUrl } from './schema-utilities';

// `site-schema.ts` にも同じ定義があるが循環参照になってしまうのでココにも定義しておく
export const tagDisplayName = 'タグ名' as const;
export const tagMaxLength   = 50       as const;

export const tagNameSchema = z.preprocess(
  preprocessUrl,
  z.string({ error: `${tagDisplayName}に文字列でないデータが入力されています` })
    .min(1, { error: `${tagDisplayName}を入力してください` })
    .max(tagMaxLength, { error: `${tagDisplayName}は文字以内で入力してください` })
);
