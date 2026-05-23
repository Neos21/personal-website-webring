import { isEmpty } from './is-empty';

/** 1以上の整数に変換する・不正な値は `null` で返す */
export const convertToPositiveInteger = (value: string | null | undefined): number | null => {
  if(isEmpty(value)) return null;
  
  const number = Number(String(value).trim());
  return Number.isInteger(number) && number > 0 ? number : null;
};
