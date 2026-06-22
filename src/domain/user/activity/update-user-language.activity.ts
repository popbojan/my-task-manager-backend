import type { UserPort } from "../port/user.port.js";
import type { Language } from "../model/language.js";
import type { User } from "../model/user.js";

export class UpdateUserLanguageActivity {
    constructor(private readonly userPort: UserPort) {}

    async execute(email: string, language: Language): Promise<User | null> {
        return this.userPort.updateLanguage(email, language);
    }
}
