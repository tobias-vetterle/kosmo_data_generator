import type { TableDefinition } from '../../state/projectStore';

function randomFromRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function generateRows(
  table: TableDefinition,
  count: number,
): Record<string, string | number>[] {
  return Array.from({ length: count }).map((_, index) => {
    const row: Record<string, string | number> = {};

    table.columns.forEach((column) => {
      if (column.kind === 'dimension') {
        if (column.isTimeDimension) {
          row[column.name] = new Date(2025, 0, index + 1).toISOString().slice(0, 10);
          return;
        }

        const values = column.categories?.filter((category) => category.label) ?? [];
        row[column.name] = values.length ? values[index % values.length].label : `${column.name}_${index + 1}`;
        return;
      }

      if (column.distribution.type === 'uniform') {
        const min = column.distribution.min ?? 0;
        const max = column.distribution.max ?? 100;
        const random = randomFromRange(min, max);
        row[column.name] = column.dataType === 'int' ? Math.round(random) : Number(random.toFixed(2));
        return;
      }

      const { mean, stdDev } = column.distribution;
      const gaussian = mean + stdDev * (Math.random() * 2 - 1);
      const clamped = Math.max(column.distribution.min ?? gaussian, Math.min(column.distribution.max ?? gaussian, gaussian));
      row[column.name] = column.dataType === 'int' ? Math.round(clamped) : Number(clamped.toFixed(2));
    });

    return row;
  });
}
