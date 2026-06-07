export class GetCurrentTimeInTimezoneActivity {
    execute(): Date {
        const timezone = process.env.RECURRING_TASK_RESET_TZ ?? "Europe/Berlin";

        return new Date(
            new Date().toLocaleString("en-US", {
                timeZone: timezone,
            }),
        );
    }
}
