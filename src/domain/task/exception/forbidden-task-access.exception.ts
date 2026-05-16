export class ForbiddenTaskAccessException extends Error {
    constructor() {
        super("You are not allowed to access this task");
        this.name = "ForbiddenTaskAccessException";
    }
}
