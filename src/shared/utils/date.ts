// src/shared/utils/date.ts

export function parseDate(value: string | number[] | null | undefined): Date | null {
    if (!value) return null;

    // Array [ano, mês, dia, hora, minuto, segundo]
    if (Array.isArray(value)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = value;
        return new Date(year, month - 1, day, hour, minute, second); // mês é 0-indexed
    }

    // String ISO normal
    return new Date(value);
}

export function formatDate(value: string | number[] | null | undefined): string {
    const date = parseDate(value);
    if (!date) return "—";
    return date.toLocaleString();
}