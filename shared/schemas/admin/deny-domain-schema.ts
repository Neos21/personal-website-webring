import z from 'zod';
import { preprocessOneLineString } from '../schema-utilities';

export const domainDisplayName = '禁止ドメイン' as const;
export const domainMaxLength   = 255            as const;

export const newDenyDomainSchema = z.object({
  domain: z.preprocess(
            preprocessOneLineString,
            z.string({ error: `${domainDisplayName}に文字列でないデータが入力されています` })
              .min(1, { error: `${domainDisplayName}を入力してください` })
              .max(domainMaxLength, { error: `${domainDisplayName}は${domainMaxLength}文字以内で入力してください` })
          )
});
