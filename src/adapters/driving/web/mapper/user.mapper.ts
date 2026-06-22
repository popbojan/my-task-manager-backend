import type { components } from "../types/api.js";
import type { User } from "../../../../domain/user/model/user.js";

type UserResponse = components["schemas"]["User"];
type UserPreferencesResponse = components["schemas"]["UserPreferencesResponse"];

export function mapUserToResponse(user: User): UserResponse {
    return {
        id: user.id,
        email: user.email,
        language: user.language,
    };
}

export function mapUserPreferencesToResponse(user: User): UserPreferencesResponse {
    return {
        language: user.language,
    };
}
