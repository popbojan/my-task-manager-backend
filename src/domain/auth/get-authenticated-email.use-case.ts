import type { ValidateAccessTokenActivity } from "./activity/validate-access-token.activity";
import type {AuthenticatedUser} from "./authenticated-user";

export class GetAuthenticatedEmailUseCase {
    constructor(private validateAccessTokenActivity: ValidateAccessTokenActivity) {}

    async execute(token: string): Promise<AuthenticatedUser | null> {
        try {
            return await this.validateAccessTokenActivity.execute(token);
        } catch {
            return null;
        }
    }
}
