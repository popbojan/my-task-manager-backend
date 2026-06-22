import type { GetUserByEmailActivity } from "./activity/get-user-by-email.activity.js";
import type { User } from "./model/user.js";

export class GetCurrentUserUseCase {
    constructor(private readonly getUserByEmailActivity: GetUserByEmailActivity) {}

    async execute(email: string): Promise<User | null> {
        return this.getUserByEmailActivity.execute(email);
    }
}
