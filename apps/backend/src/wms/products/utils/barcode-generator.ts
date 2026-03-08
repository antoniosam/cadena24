/**
 * Barcode Generator Utility
 * Generates CODE128 compatible barcodes from timestamp
 */

/**
 * Generates a CODE128 barcode from current timestamp
 * Format: YYYYMMDDHHmmss (14 digits)
 * Example: 20260307143022
 *
 * CODE128 can encode ASCII 0-127, optimal length is 12-20 characters
 *
 * @returns {string} 14-digit barcode based on current timestamp
 */
export function generateBarcode(): string {
  const now = new Date();

  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Validates if a barcode is CODE128 compatible
 * CODE128 supports ASCII characters 0-127
 * Recommended length: 1-48 characters (practical limit for scanning)
 *
 * @param {string} barcode - The barcode to validate
 * @returns {boolean} True if valid CODE128 barcode
 */
export function isValidCode128(barcode: string): boolean {
  if (!barcode || barcode.length === 0 || barcode.length > 48) {
    return false;
  }

  // Check if all characters are ASCII 0-127
  for (let i = 0; i < barcode.length; i++) {
    const charCode = barcode.charCodeAt(i);
    if (charCode < 0 || charCode > 127) {
      return false;
    }
  }

  return true;
}
