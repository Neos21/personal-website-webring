import z from 'zod';

import { preprocessBooleanNumber, preprocessMultiLinesString, preprocessOneLineString, propertyTurnstileToken } from './schema-utilities';
import { isEmpty } from '../helpers/is-empty';
import { tagNameSchema } from './admin/tag-schema';

export const siteNameDisplayName           = 'サイト名'             as const;
export const siteNameMaxLength             = 100                    as const;
export const urlDisplayName                = 'URL'                  as const;
export const urlMaxLength                  = 500                    as const;
export const ownerNameDisplayName          = '管理人名'             as const;
export const ownerNameMaxLength            = 50                     as const;
export const descriptionDisplayName        = '説明文'               as const;
export const descriptionMaxLength          = 500                    as const;
export const tagDisplayName                = 'タグ名'               as const;
export const tagMaxLength                  = 50                     as const;
export const tagsMax                       = 10                     as const;
export const bannerUrlDisplayName          = 'バナー URL'           as const;
export const bannerUrlMaxLength            = 500                    as const;
export const bannerWidthDisplayName        = 'バナー横幅'           as const;
export const bannerHeightDisplayName       = 'バナー高さ'           as const;
export const passwordDisplayName           = '管理パスワード'       as const;
export const passwordMaxLength             = 128                    as const;
export const recommenderNameDisplayName    = '推薦者ハンドルネーム' as const;
export const recommenderNameMaxLength      = 50                     as const;
export const recommenderCommentDisplayName = '推薦コメント'         as const;
export const recommenderCommentMaxLength   = 500                    as const;

export const refineBanneSize = (data: any, context: any): void => {  // eslint-disable-line @typescript-eslint/no-explicit-any
  if(!isEmpty(data.banner_url) && (isEmpty(data.banner_width) || isEmpty(data.banner_height))) context.addIssue({ code: 'custom', message: `${bannerUrlDisplayName} を指定する場合はバナーサイズも選択してください` });
  
  if(!isEmpty(data.banner_url) && !isEmpty(data.banner_width) && !isEmpty(data.banner_height)) {
    const isValidSize = (data.banner_width === 200 && data.banner_height === 40) || (data.banner_width === 88 && data.banner_height === 31);
    if(!isValidSize) context.addIssue({ code: 'custom', message: 'バナー画像のサイズは 200x40 または 88x31 のいずれかを選択してください' });
  }
};

export const newSiteSchema = z.object({
  is_self             : z.preprocess(
                          preprocessBooleanNumber,
                          z.union([z.literal(0), z.literal(1)])
                        ),
  site_name           : z.preprocess(
                          preprocessOneLineString,
                          z.string({ error: `${siteNameDisplayName}に文字列でないデータが入力されています` })
                            .min(1, { error: `${siteNameDisplayName}を入力してください` })
                            .max(siteNameMaxLength, { error: `${siteNameDisplayName}は${siteNameMaxLength}文字以内で入力してください` })
                        ),
  url                 : z.preprocess(
                          preprocessOneLineString,
                          z.httpUrl({ error: `${urlDisplayName}に文字列でないデータが入力されています` })
                            .min(1, { error: `${urlDisplayName}を入力してください` })
                            .max(urlMaxLength, { error: `${urlDisplayName}は${urlMaxLength}文字以内で入力してください` })
                        ),
  owner_name          : z.preprocess(
                          preprocessOneLineString,
                          z.string({ error: `${ownerNameDisplayName}に文字列でないデータが入力されています` })
                            .max(ownerNameMaxLength, { error: `${ownerNameDisplayName}は${ownerNameMaxLength}文字以内で入力してください` })
                            .nullish()
                        ),
  description         : z.preprocess(
                          preprocessMultiLinesString,
                          z.string({ error: `${descriptionDisplayName}に文字列でないデータが入力されています` })
                            .max(descriptionMaxLength, { error: `${descriptionDisplayName}は${descriptionMaxLength}文字以内で入力してください` })
                            .nullish()
                        ),
  tags                : z.preprocess(
                          value => {
                            if(value == null) return [];
                            if(Array.isArray(value)) return value;
                            // 文字列の場合カンマで区切り配列にする
                            if(typeof value === 'string') return value
                              .split(',')
                              .map(tag => String(tag).trim())
                              .filter(Boolean);
                            return [];
                          },
                          z.array(tagNameSchema)
                            .min(1, { error: `${tagDisplayName}を1つ以上指定してください` })
                            .max(tagsMax, { error: `${tagDisplayName}は最大${tagsMax}個まで指定できます` })
                        ),
  banner_url          : z.preprocess(
                          preprocessOneLineString,
                          z.httpUrl({ error: `${bannerUrlDisplayName} に文字列でないデータが入力されています` })
                            .max(bannerUrlMaxLength, { error: `${bannerUrlDisplayName} は${bannerUrlMaxLength}文字以内で入力してください` })
                            .nullish()
                        ),
  banner_width        : z.coerce.number({ error: `${bannerWidthDisplayName}に数値が指定されていません` })
                          .int({ error: `${bannerWidthDisplayName}に整数が指定されていません` })
                          .min(1, { error: `${bannerWidthDisplayName}に1以上の整数が指定されていません` })
                          .nullish(),
  banner_height       : z.coerce.number({ error: `${bannerHeightDisplayName}に数値が指定されていません` })
                          .int({ error: `${bannerHeightDisplayName}に整数が指定されていません` })
                          .min(1, { error: `${bannerHeightDisplayName}に1以上の整数が指定されていません` })
                          .nullish(),
  password            : z.preprocess(
                          preprocessOneLineString,
                          z.string({ error: `${passwordDisplayName}に文字列でないデータが入力されています` })
                            .max(passwordMaxLength, { error: `${passwordDisplayName}は${passwordMaxLength}文字以内で入力してください` })
                            .nullish()
                        ),
  recommender_name    : z.preprocess(
                          preprocessOneLineString,
                          z.string({ error: `${recommenderNameDisplayName}に文字列でないデータが入力されています` })
                            .max(recommenderNameMaxLength, { error: `${recommenderNameDisplayName}は${recommenderNameMaxLength}文字以内で入力してください` })
                            .nullish()
                        ),
  recommender_comment : z.preprocess(
                          preprocessOneLineString,
                          z.string({ error: `${recommenderCommentDisplayName}に文字列でないデータが入力されています` })
                            .max(recommenderCommentMaxLength, { error: `${recommenderCommentDisplayName}は${recommenderCommentMaxLength}文字以内で入力してください` })
                            .nullish()
                        ),
  turnstile_token     : propertyTurnstileToken
}).superRefine((data, context) => {
  if(data.is_self === 1 && isEmpty(data.password)) context.addIssue({ code: 'custom', message: `${passwordDisplayName}は自薦登録時に必須です` });
  
  if(data.is_self === 1 && !isEmpty(data.recommender_name)) context.addIssue({ code: 'custom', message: `${recommenderNameDisplayName}は自薦登録時には入力できません` });
  
  if(data.is_self === 1 && !isEmpty(data.recommender_comment)) context.addIssue({ code: 'custom', message: `${recommenderCommentDisplayName}は自薦登録時には入力できません` });
  
  if(data.is_self === 0 && !isEmpty(data.password)) context.addIssue({ code: 'custom', message: `${passwordDisplayName}は他薦登録時には入力できません` });
  
  if(data.is_self === 0 && isEmpty(data.recommender_comment)) context.addIssue({ code: 'custom', message: `${recommenderCommentDisplayName} は他薦登録時に必須です` });
  
  refineBanneSize(data, context);
});

export const updateSiteSchema = newSiteSchema.omit({
  is_self            : true,
  recommender_name   : true,
  recommender_comment: true
}).superRefine((data, context) => {
  refineBanneSize(data, context);
});

export const deleteSiteSchema = z.object({
  password        : z.preprocess(
                      preprocessOneLineString,
                      z.string({ error: `${passwordDisplayName}に文字列でないデータが入力されています` })
                        .min(1, { error: `${passwordDisplayName}を入力してください` })
                        .max(passwordMaxLength, { error: `${passwordDisplayName}は${passwordMaxLength}文字以内で入力してください` })
                    ),
  turnstile_token : propertyTurnstileToken
});
