import type { PrismaClient } from "@prisma/client";
import type { UserPort } from "../../../domain/user/port/user.port.js";
import type { Language } from "../../../domain/user/model/language.js";
import type { User } from "../../../domain/user/model/user.js";
import {mapUserToDomain} from "../mapper/user.mapper";

export class PrismaUserAdapter implements UserPort {
    constructor(private readonly prisma: PrismaClient) {}

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return null;
        }

        return mapUserToDomain(user);
    }

    async registerUser(email: string, language: Language): Promise<User> {
        const user = await this.prisma.user.upsert({ // update or insert
            where: { email },
            create: { email, language },
            update: { language },
        });

        return mapUserToDomain(user);
    }

    async updateLanguage(email: string, language: Language): Promise<User | null> {
        const existing = await this.findByEmail(email);

        if (!existing) {
            return null;
        }

        const user = await this.prisma.user.update({
            where: { email },
            data: { language },
        });

        return mapUserToDomain(user);
    }
}
