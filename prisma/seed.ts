import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const email = process.env.SEED_USER_EMAIL ?? "popbojan@yahoo.com";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function deadlineInDays(daysFromNow: number): Date {
    return new Date(Date.now() + daysFromNow * MS_PER_DAY);
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const dummyTasks = [
    {
        title: "Login mit OTP testen",
        description: "Deadline grün — noch mehr als 1 Monat Zeit",
        status: "todo" as const,
        priority: "important" as const,
        deadline: deadlineInDays(45),
    },
    {
        title: "Task-Board Layout anpassen",
        description: "Deadline gelb — noch 2+ Wochen, unter 1 Monat",
        status: "todo" as const,
        priority: "none" as const,
        deadline: deadlineInDays(21),
    },
    {
        title: "Drag & Drop Statuswechsel",
        description: "Deadline orange — noch etwa 1 Woche",
        status: "in_progress" as const,
        priority: "important_urgent" as const,
        deadline: deadlineInDays(5),
    },
    {
        title: "API-Client regenerieren",
        description: "Deadline rot — weniger als 1 Tag übrig",
        status: "in_progress" as const,
        priority: "urgent" as const,
        deadline: deadlineInDays(0.5),
    },
    {
        title: "Code Review: Task Endpoints",
        description: "Deadline gelb — Review in ca. 3 Wochen",
        status: "review" as const,
        priority: "important" as const,
        deadline: deadlineInDays(18),
    },
    {
        title: "Dummy-Daten für Demo",
        description: "Deadline grün — Demo-Task mit viel Vorlauf",
        status: "done" as const,
        priority: "none" as const,
        deadline: deadlineInDays(60),
    },
    {
        title: "Header und Logout",
        description: "Deadline rot — überfällig (sehr rot)",
        status: "done" as const,
        priority: "important" as const,
        deadline: deadlineInDays(-2),
    },
];

async function main() {
    const user = await prisma.user.upsert({
        where: { email },
        create: { email, language: "de" },
        update: { language: "de" },
    });

    const deleted = await prisma.task.deleteMany({ where: { userId: user.id } });

    await prisma.task.createMany({
        data: dummyTasks.map((task) => ({
            ...task,
            userId: user.id,
        })),
    });

    console.log(
        `Re-seeded ${dummyTasks.length} demo tasks for ${email}` +
            (deleted.count > 0 ? ` (replaced ${deleted.count} existing).` : "."),
    );
    console.log("Deadline colors: grün ≥30d | gelb ≥14d | orange <14d | rot ≤1d");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
