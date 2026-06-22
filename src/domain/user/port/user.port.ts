import type { Language } from "../model/language";
import type { User } from "../model/user";

export interface UserPort {
    findByEmail(email: string): Promise<User | null>;
    registerUser(email: string, language: Language): Promise<User>;
    updateLanguage(email: string, language: Language): Promise<User | null>;
}
