import z from 'zod';

import { isEmpty } from '../helpers/is-empty';
import { reduceNewlines } from '../helpers/reduce-newlines';

export const siteNameDisplayName           = 'サイト名';
export const siteNameMaxLength             = 100;
export const urlDisplayName                = 'URL';
export const urlMaxLength                  = 500;
export const ownerNameDisplayName          = '管理人名';
export const ownerNameMaxLength            = 50;
export const descriptionDisplayName        = '説明文';
export const descriptionMaxLength          = 500;
export const tagDisplayName                = 'タグ名';
export const tagMaxLength                  = 50;
export const tagsMax                       = 10;
export const bannerUrlDisplayName          = 'バナー URL';
export const bannerUrlMaxLength            = 500;
export const bannerWidthDisplayName        = 'バナー横幅';
export const bannerHeightDisplayName       = 'バナー高さ';
export const passwordDisplayName           = '管理パスワード';
export const passwordMaxLength             = 128;
export const recommenderNameDisplayName    = '推薦者ハンドルネーム';
export const recommenderNameMaxLength      = 50;
export const recommenderCommentDisplayName = '推薦コメント';
export const recommenderCommentMaxLength   = 500;

export const newSiteSchema = z.object({
  is_self             : z.preprocess(
                          value => {
                            if(typeof value === 'number') return value;
                            if(typeof value === 'boolean') return value ? 1 : 0;
                            if(typeof value === 'string') {
                              const normalized = value.trim().toLowerCase();
                              if(['1', 'true' ].includes(normalized)) return 1;
                              if(['0', 'false'].includes(normalized)) return 0;
                              return value;
                            }
                            return value;
                          },
                          z.union([z.literal(0), z.literal(1)])
                        ),
  site_name           : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                          z.string({ error: `${siteNameDisplayName}に文字列でないデータが入力されています` })
                            .min(1, { error: `${siteNameDisplayName}を入力してください` })
                            .max(siteNameMaxLength, { error: `${siteNameDisplayName}は${siteNameMaxLength}文字以内で入力してください` })
                        ),
  url                 : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                          z.string({ error: `${urlDisplayName}に文字列でないデータが入力されています` })
                            .min(1, { error: `${urlDisplayName}を入力してください` })
                            .max(urlMaxLength, { error: `${urlDisplayName}は${urlMaxLength}文字以内で入力してください` })
                        ),
  owner_name          : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                          z.string({ error: `${ownerNameDisplayName}に文字列でないデータが入力されています` })
                            .max(ownerNameMaxLength, { error: `${ownerNameDisplayName}は${ownerNameMaxLength}文字以内で入力してください` })
                            .nullable()
                        ),
  description         : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? reduceNewlines(value.trim()) : value,
                          z.string({ error: `${descriptionDisplayName}に文字列でないデータが入力されています` })
                            .max(descriptionMaxLength, { error: `${descriptionDisplayName}は${descriptionMaxLength}文字以内で入力してください` })
                            .nullable()
                        ),
  tags                : z.preprocess(
                          value => {
                            if(value == null) return [];
                            if(Array.isArray(value)) return value;
                            if(typeof value === 'string') return value
                              .split((/[\s,]+/))
                              .map(tag => typeof tag === 'string' ? tag.trim() : String(tag).trim())
                              .filter(Boolean);
                            return [];
                          },
                          z.array(
                            z.string({ error: `${tagDisplayName}に文字列でないデータが入力されています` })
                              .max(tagMaxLength, { error: `${tagDisplayName}は${tagMaxLength}文字以内で入力してください` })
                          )
                            .min(1, { error: `${tagDisplayName}を1つ以上指定してください` })
                            .max(tagsMax, { error: `${tagDisplayName}は最大${tagsMax}個まで指定できます` })
                        ),
  banner_url          : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                          z.string({ error: `${bannerUrlDisplayName} に文字列でないデータが入力されています` })
                            .max(bannerUrlMaxLength, { error: `${bannerUrlDisplayName} は${bannerUrlMaxLength}文字以内で入力してください` })
                            .nullable()
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
                          value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                          z.string({ error: `${passwordDisplayName}に文字列でないデータが入力されています` })
                            .max(passwordMaxLength, { error: `${passwordDisplayName}は${passwordMaxLength}文字以内で入力してください` })
                            .nullable()
                        ),
  recommender_name    : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                          z.string({ error: `${recommenderNameDisplayName}に文字列でないデータが入力されています` })
                            .max(recommenderNameMaxLength, { error: `${recommenderNameDisplayName}は${recommenderNameMaxLength}文字以内で入力してください` })
                            .nullable()
                        ),
  recommender_comment : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? reduceNewlines(value.trim()) : value,
                          z.string({ error: `${recommenderCommentDisplayName}に文字列でないデータが入力されています` })
                            .max(recommenderCommentMaxLength, { error: `${recommenderCommentDisplayName}は${recommenderCommentMaxLength}文字以内で入力してください` })
                            .nullable()
                        ),
  turnstile_token     : z.preprocess(
                          value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                          z.string({ error: 'Turnstile 認証を行ってください' })
                            .min(1, { error: 'Turnstile 認証を行ってください' })
                        )
}).superRefine((data, context) => {
  if(data.is_self === 1 && isEmpty(data.password)) context.addIssue({ code: 'custom', message: `${passwordDisplayName}は自薦登録時に必須です` });
  
  if(data.is_self === 0 && isEmpty(data.recommender_comment)) context.addIssue({ code: 'custom', message: `${recommenderCommentDisplayName} は他薦登録時に必須です` });
  
  if(!isEmpty(data.banner_url) && (isEmpty(data.banner_width) || isEmpty(data.banner_height))) context.addIssue({ code: 'custom', message: `${bannerUrlDisplayName} を指定する場合はバナーサイズも選択してください` });
  
  if(!isEmpty(data.banner_url) && !isEmpty(data.banner_width) && !isEmpty(data.banner_height)) {
    const isValidSize = (data.banner_width === 200 && data.banner_height === 40) || (data.banner_width === 88 && data.banner_height === 31);
    if(!isValidSize) context.addIssue({ code: 'custom', message: 'バナー画像のサイズは 200x40 または 88x31 のいずれかを選択してください' });
  }
});
