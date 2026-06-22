import type { UpdateUserLanguageActivity } from "./activity/update-user-language.activity.js";
import type { Language } from "./model/language.js";

export class UpdateUserPreferencesUseCase {
    constructor(private readonly updateUserLanguageActivity: UpdateUserLanguageActivity) {}

    async execute(
        email: string,
        language: Language,
    ): Promise<{ language: Language } | null> {
        const user = await this.updateUserLanguageActivity.execute(email, language);

        if (!user) {
            return null;
        }

        return { language: user.language };
    }
}
