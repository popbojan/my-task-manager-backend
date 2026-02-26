export interface CryptoPort {

  randomHex(bytes: number): string;

  sha256Hex(value: string): string;

}