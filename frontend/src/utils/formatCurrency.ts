/**
 * 🔵 FUNCIÓN STATELESS (Sin Estado)
 *
 * Esta es una función PURA que no mantiene estado interno.
 * Siempre produce la misma salida para la misma entrada.
 * No tiene efectos secundarios (side effects).
 *
 * Ejemplo: formatCurrency(29.99) → "S/ 29.99"
 *          formatCurrency(29.99) → siempre "S/ 29.99"
 */
const localeByLanguage: Record<string, string> = {
  en: 'en-US',
  es: 'es-PE',
  pt: 'pt-BR',
};

export function formatCurrency(amount: number, language = 'es', currency = 'PEN'): string {
  return new Intl.NumberFormat(localeByLanguage[language] ?? localeByLanguage.es, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
