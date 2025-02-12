// import crc32 from "crc32";
import baseX from "base-x";
import { getAddress } from 'viem';

const base62 = baseX("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");

export function compressEthAddress(ethAddress) {
  const hexString = ethAddress.replace("0x", "");
  const base62String = base62.encode(Buffer.from(hexString, "hex"));
  // const checksum = crc32.buf(base62String) & 0xf;
  // const checksumChar = base62.encode(Buffer.from([checksum]));
  return base62String;// + checksumChar;
}

export function decompressEthAddress(compressedAddress) {
  //const checksumChar = compressedAddress.slice(-1);
  const base62String = compressedAddress//.slice(0, -1);
  // const checksum = base62.decode(checksumChar)[0];
  // if ((crc32.buf(base62String) & 0xf) !== checksum) {
  //   throw new Error("Invalid checksum");
  // }
  const hexString = uint8ArrayToHex(base62.decode(base62String));
  return getAddress("0x" + hexString);
}

/// convert Uint8Array to hex string
export function uint8ArrayToHex(arr) {
  return Array.from(arr, x => ("0" + x.toString(16)).slice(-2)).join("");
}