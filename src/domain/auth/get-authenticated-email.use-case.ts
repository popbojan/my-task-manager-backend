import type {ValidateAccessTokenActivity} from "./activity/validate-access-token.activity";

export class GetAuthenticatedEmailUseCase {
    constructor(
        private validateAccessTokenActivity: ValidateAccessTokenActivity
    ) {}

    async execute(token: string): Promise<string | null> {
        try {
            const payload = await this.validateAccessTokenActivity.execute(token);
            return payload.email;
        } catch {
            return null;
        }
    }
}