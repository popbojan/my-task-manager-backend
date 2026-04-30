import type { ValidateAccessTokenActivity } from "./activity/validate-access-token.activity";

export class GetAuthenticatedEmailUseCase {
    constructor(
        private validateAccessTokenActivity: ValidateAccessTokenActivity
    ) {
    }

    async execute(authorizationHeader?: string): Promise<string | null> {
        if (!authorizationHeader?.startsWith("Bearer ")) {
            return null;
        }

        const token = authorizationHeader.slice("Bearer ".length);

        const payload = await this.validateAccessTokenActivity.execute(token);

        return payload.email;
    }
}