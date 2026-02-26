import { createHash, randomBytes } from "crypto";
import type {CryptoPort} from "../../../domain/auth/port/crypto-port";

export class CryptoAdapter implements CryptoPort {
    randomHex(bytes: number): string {
        return randomBytes(bytes).toString("hex");
    }

    sha256Hex(value: string): string {
        return createHash("sha256").update(value).digest("hex");
    }
}