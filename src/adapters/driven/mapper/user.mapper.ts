import type { User as PrismaUser } from "@prisma/client";
import type {User} from "../../../domain/user/model/user";

export function mapUserToDomain(user: PrismaUser): User {
    return {
        id: user.id,
        email: user.email,
        language: user.language,
    };
}