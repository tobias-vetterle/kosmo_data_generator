import type { TableDefinition } from '../../state/projectStore';

export function generateRows(
  table: TableDefinition,
  count: number,
): Record<string, string | number>[] {
  return Array.from({ length: count }).map((_, index) => {
    const row: Record<string, string | number> = {};

    table.columns.forEach((column) => {
      if (column.type === 'number') {
        row[column.name] = index + 1;
      } else if (column.type === 'date') {
        row[column.name] = new Date(2025, 0, index + 1).toISOString().slice(0, 10);
      } else {
        row[column.name] = `${column.name}_${index + 1}`;
      }
    });

    return row;
  });
}
