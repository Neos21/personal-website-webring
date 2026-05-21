import { isEmpty } from './is-empty';

export const convertUtcToJst = (utcString: string | null | undefined, isDateOnly: boolean = false): string => {
  if(isEmpty(utcString) || !(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/).test(utcString!)) return '-';
  
  const normalizedUtcString = `${utcString!.replace(' ', 'T')}Z`;
  const utc = new Date(normalizedUtcString);
  const jst = new Date(utc.getTime() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
  
  const year  = jst.getFullYear();
  const month = String(jst.getMonth() + 1).padStart(2, '0');
  const date  = String(jst.getDate()     ).padStart(2, '0');
  
  if(isDateOnly) return `${year}-${month}-${date}`;
  
  const hours   = String(jst.getHours()  ).padStart(2, '0');
  const minutes = String(jst.getMinutes()).padStart(2, '0');
  const seconds = String(jst.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};
