/** URL 文字列のハッシュ・末尾スラッシュを除去し、小文字に統一する */
export const normalizeUrlExact = (value: string): string => {
  return value.trim().toLowerCase().replace((/#.*$/), '').replace((/\/?$/), '');
};

/** URL 文字列の `www`・`index.html`・末尾スラッシュ等を除去して小文字に統一し正規化する */
export const normalizeUrlNearby = (value: string): string => {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    let hostname = url.hostname.toLowerCase();
    if(hostname.startsWith('www.')) hostname = hostname.slice(4);
    
    const pathname = url.pathname.replace((/\/index(?:\.[^/?#]+)?$/i), '').replace((/\/$/), '');
    
    return `${hostname}${pathname}`;
  }
  catch {
    return normalizeUrlExact(trimmed);
  }
};
