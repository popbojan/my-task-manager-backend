export class ForbiddenRecurringTaskAccessException extends Error {
    constructor() {
        super("You are not allowed to access this recurring task");
        this.name = "ForbiddenRecurringTaskAccessException";
    }
}
