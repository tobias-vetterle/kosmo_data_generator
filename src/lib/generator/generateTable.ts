import type { ColumnDefinition, TableDefinition } from '../../state/projectStore';

export type RowValue = string | number;
export type TableRow = Record<string, RowValue>;

function randomFromRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

function clamp(value: number, min?: number, max?: number): number {
  if (typeof min === 'number' && value < min) {
    return min;
  }

  if (typeof max === 'number' && value > max) {
    return max;
  }

  return value;
}

function pickWeightedCategory(column: Extract<ColumnDefinition, { kind: 'dimension' }>): string {
  const categories = column.categories?.filter((entry) => entry.label.trim()) ?? [];
  if (categories.length === 0) {
    return column.name;
  }

  const weighted = categories.map((entry) => ({
    label: entry.label,
    weight: entry.weight && entry.weight > 0 ? entry.weight : 1,
  }));

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const entry of weighted) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry.label;
    }
  }

  return weighted[weighted.length - 1].label;
}

function generateMetricValue(column: Extract<ColumnDefinition, { kind: 'metric' }>): number {
  let raw: number;

  if (column.distribution.type === 'uniform') {
    const min = column.distribution.min ?? 0;
    const max = column.distribution.max ?? min + 100;
    raw = randomFromRange(min, max);
  } else {
    const mean = column.distribution.mean;
    const stdDev = column.distribution.stdDev;
    raw = randomNormal(mean, stdDev);
    raw = clamp(raw, column.distribution.min, column.distribution.max);
  }

  return column.dataType === 'int' ? Math.round(raw) : Number(raw.toFixed(2));
}

function applySimpleCorrelations(row: TableRow, columns: ColumnDefinition[]): TableRow {
  for (const column of columns) {
    if (!column.sharedRef) {
      continue;
    }

    const sourceColumnName = columns.find((entry) => entry.id === column.sharedRef?.sourceColumnId)?.name;
    if (!sourceColumnName || !(sourceColumnName in row)) {
      continue;
    }

    const sourceValue = row[sourceColumnName];

    if (column.kind === 'metric' && typeof sourceValue === 'number') {
      const correlated = typeof row[column.name] === 'number' ? (row[column.name] as number) : 0;
      row[column.name] = column.dataType === 'int'
        ? Math.round(correlated * 0.3 + sourceValue * 0.7)
        : Number((correlated * 0.3 + sourceValue * 0.7).toFixed(2));
      continue;
    }

    if (column.kind === 'dimension') {
      row[column.name] = String(sourceValue);
    }
  }

  return row;
}

export function generateTableRows(table: TableDefinition, count: number): TableRow[] {
  const safeCount = Math.max(0, count);

  return Array.from({ length: safeCount }).map((_, index) => {
    const row: TableRow = {};

    table.columns.forEach((column) => {
      if (column.kind === 'dimension') {
        if (column.isTimeDimension) {
          row[column.name] = new Date(2025, 0, 1 + index).toISOString().slice(0, 10);
          return;
        }

        row[column.name] = pickWeightedCategory(column);
        return;
      }

      row[column.name] = generateMetricValue(column);
    });

    return applySimpleCorrelations(row, table.columns);
  });
}
