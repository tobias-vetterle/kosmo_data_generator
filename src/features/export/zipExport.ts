import { createZip } from '../../lib/export/createZip';
import type { GeneratedRow, TableDefinition } from '../../state/projectStore';

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function rowsToCsv(rows: GeneratedRow[]): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(',');
  const lines = rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? '')).join(','));
  return [headerLine, ...lines].join('\n');
}

export function createTablesZip(tables: TableDefinition[], generatedRowsByTableId: Record<string, GeneratedRow[]>): Blob {
  const files = tables.map((table) => {
    const rows = generatedRowsByTableId[table.id] ?? [];
    return {
      name: `${table.name}.csv`,
      content: rowsToCsv(rows),
    };
  });

  return createZip(files);
}
