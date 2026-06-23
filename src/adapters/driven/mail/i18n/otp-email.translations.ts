import type {Language} from "../../../../domain/user/model/language";

export const otpEmailTranslations = {
    sr: {
        subject: "Tvoj kod za prijavu",
        intro: "Tvoj jednokratni kod za prijavu je:",
        validFor: "Kod važi 4 minuta.",
    },
    de: {
        subject: "Dein Anmeldecode",
        intro: "Dein einmaliger Anmeldecode lautet:",
        validFor: "Der Code ist 4 Minuten gültig.",
    },
    fr: {
        subject: "Votre code de connexion",
        intro: "Votre code de connexion à usage unique est :",
        validFor: "Ce code est valable pendant 4 minutes.",
    },
    en: {
        subject: "Your login code",
        intro: "Your one-time login code is:",
        validFor: "This code is valid for 4 minutes.",
    },
} satisfies Record<Language, {
    subject: string;
    intro: string;
    validFor: string;
}>;