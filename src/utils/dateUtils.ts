
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

// Converte DD/MM/YYYY para YYYY-MM-DD
export function convertToISO(dateStr: string): string | null {
 
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(regex);

    if (!match) return null;

    const [_, day, month, year] = match;

    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
}