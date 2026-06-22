import type {Language} from "../../../../domain/user/model/language";

export const otpEmailTranslations = {
    en: {
        subject: "Your login code",
        intro: "Your one-time login code is:",
        validFor: "This code is valid for 4 minutes.",
    },
    de: {
        subject: "Dein Anmeldecode",
        intro: "Dein einmaliger Anmeldecode lautet:",
        validFor: "Der Code ist 4 Minuten gültig.",
    },
    sr: {
        subject: "Tvoj kod za prijavu",
        intro: "Tvoj jednokratni kod za prijavu je:",
        validFor: "Kod važi 4 minuta.",
    },
} satisfies Record<Language, {
    subject: string;
    intro: string;
    validFor: string;
}>;