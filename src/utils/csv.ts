// Shared CSV export - turns rows of plain values into a CSV string and hands
// it to the browser as a file download. Nothing leaves the device.

export type CsvValue = string | number | boolean;

function escapeCell(value: CsvValue): string {
  const text = String(value);
  // Quote anything containing a delimiter, quote, or newline (RFC 4180).
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
