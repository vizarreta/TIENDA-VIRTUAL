/**
 * 🔵 FUNCIÓN STATELESS (Sin Estado)
 * 
 * Esta es una función PURA que no mantiene estado interno.
 * Siempre produce la misma salida para la misma entrada.
 * No tiene efectos secundarios (side effects).
 * 
 * Ejemplo: formatCurrency(29.99) → "$29.99"
 *          formatCurrency(29.99) → siempre "$29.99"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
