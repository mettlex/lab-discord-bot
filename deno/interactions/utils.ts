/** Converts a hexadecimal string to Uint8Array. */
export function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
}

export const sleep = (ms: number) =>
  new Promise((resolve) => {
    const tid = setTimeout(() => {
      clearTimeout(tid);
      resolve(true);
    }, ms);
  });
