/** IPv6 アドレスを完全展開した後、後半64ビット (端末固有の識別子であり変動) を省略して `::/64` とした値を返す */  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
export const convertIpV6AddressTo64Bit = (ip: string): string => {
  ip = ip.trim();
  if(!ip.includes(':')) return ip;  // IPv6 でない値が渡された場合はそのまま返す
  
  if(ip.includes('::')) {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
    const parts = ip.split('::');  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
    const left  = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missingCount = 8 - (left.length + right.length);
    ip = left.concat(Array(missingCount).fill('0'), right).join(':');
  }
  ip = ip.split(':').map(segment => segment.length === 0 ? '0000' : segment.padStart(4, '0')).join(':');
  const ip64Bit = `${ip.split(':').slice(0, 4).join(':')}::/64`;  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  return ip64Bit;
};
