import type { MetricColumnConfig } from '../../domain/models';

export type BoundsWarning = {
  columnId: string;
  message: string;
};

export type BoundsWarningHandler = (warning: BoundsWarning) => void;

const warnedColumns = new Set<string>();

function emitWarningOnce(
  columnId: string,
  message: string,
  onWarning?: BoundsWarningHandler,
): void {
  const key = `${columnId}:${message}`;
  if (warnedColumns.has(key)) {
    return;
  }

  warnedColumns.add(key);
  onWarning?.({ columnId, message });
}

export function clampMetricValue(
  value: number,
  metricColumn: MetricColumnConfig,
  onWarning?: BoundsWarningHandler,
): number {
  const min = metricColumn.distribution.min;
  const max = metricColumn.distribution.max;

  if (min !== undefined && max !== undefined && min > max) {
    emitWarningOnce(
      metricColumn.id,
      `Widersprüchliche Bounds erkannt (min=${min}, max=${max}). Wert wird auf min geklemmt.`,
      onWarning,
    );

    const invalidRangeValue = metricColumn.dataType === 'int' ? Math.round(min) : min;
    return invalidRangeValue;
  }

  let clamped = value;
  if (min !== undefined) {
    clamped = Math.max(min, clamped);
  }

  if (max !== undefined) {
    clamped = Math.min(max, clamped);
  }

  if (metricColumn.dataType === 'int') {
    return Math.round(clamped);
  }

  return Number.isFinite(clamped) ? clamped : 0;
}

export function clampMetricColumnsInRow(
  row: Record<string, string | number>,
  metricColumns: MetricColumnConfig[],
  onWarning?: BoundsWarningHandler,
): void {
  metricColumns.forEach((column) => {
    const rawValue = row[column.name];
    if (typeof rawValue !== 'number') {
      return;
    }

    row[column.name] = clampMetricValue(rawValue, column, onWarning);
  });
}
