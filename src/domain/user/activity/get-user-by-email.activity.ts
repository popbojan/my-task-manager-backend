import type { UserPort } from "../port/user.port.js";
import type { User } from "../model/user.js";

export class GetUserByEmailActivity {
    constructor(private readonly userPort: UserPort) {}

    async execute(email: string): Promise<User | null> {
        return this.userPort.findByEmail(email);
    }
}
