/** IPv6 アドレスを完全展開した後、後半64ビット (端末固有の識別子であり変動) を省略して ` : : /64` とした値を返す */
export const convertIpV6AddressTo64Bit = (ipV6Address: string): string => {
  let fullAddress = ipV6Address;
  if(fullAddress.includes(': :')) {
    const parts = ipV6Address.split(': :');
    const left  = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missingCount = 8 - (left.length + right.length);
    fullAddress = left.concat(Array(missingCount).fill('0'), right).join(':');
  }
  fullAddress = fullAddress.split(':').map(segment => segment.length === 0 ? '0000' : segment.padStart(4, '0')).join(':');
  const prefix64 = `${fullAddress.split(':').slice(0, 4).join(':')}: : /64`;
  return prefix64;
};
