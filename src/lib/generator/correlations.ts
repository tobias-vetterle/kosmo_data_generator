import type { MetricColumnConfig, TableConfig } from '../../domain/models';
import { clampMetricColumnsInRow, clampMetricValue } from './bounds';

export type DimensionCondition = {
  columnId: string;
  equals: string | number | Array<string | number>;
};

export type MetricEffect = {
  offset?: number;
  multiplier?: number;
  probabilityAdjustment?: number;
};

export type IntraTableCorrelationRule = {
  id: string;
  tableId: string;
  targetMetricColumnId: string;
  when: DimensionCondition[];
  effect: MetricEffect;
  applicationProbability?: number;
};

export type JoinColumnMapping = {
  sourceColumnId: string;
  targetColumnId: string;
};

export type CrossTableCorrelationRule = {
  id: string;
  sourceTableId: string;
  targetTableId: string;
  joinColumns: JoinColumnMapping[];
  sourceMetricColumnId: string;
  targetMetricColumnId: string;
  influenceFactor: number;
  influenceOffset?: number;
};

export type CorrelationWarningHandler = (message: string) => void;

function getColumnNameById(table: TableConfig, columnId: string): string | null {
  return table.columns.find((column) => column.id === columnId)?.name ?? null;
}

function matchesCondition(
  row: Record<string, string | number>,
  condition: DimensionCondition,
  table: TableConfig,
): boolean {
  const columnName = getColumnNameById(table, condition.columnId);
  if (!columnName) {
    return false;
  }

  const value = row[columnName];
  const expected = Array.isArray(condition.equals) ? condition.equals : [condition.equals];
  return expected.some((candidate) => candidate === value);
}

function resolveMetricColumn(
  table: TableConfig,
  metricColumnId: string,
): { column: MetricColumnConfig; columnName: string } | null {
  const column = table.columns.find(
    (entry): entry is MetricColumnConfig => entry.id === metricColumnId && entry.kind === 'metric',
  );

  if (!column) {
    return null;
  }

  return { column, columnName: column.name };
}

function resolveApplicationProbability(
  baseProbability = 1,
  probabilityAdjustment = 0,
): number {
  return Math.max(0, Math.min(1, baseProbability + probabilityAdjustment));
}

export function applyIntraTableCorrelations(
  rows: Record<string, string | number>[],
  table: TableConfig,
  rules: IntraTableCorrelationRule[],
  onWarning?: CorrelationWarningHandler,
): Record<string, string | number>[] {
  const metricColumns = table.columns.filter(
    (column): column is MetricColumnConfig => column.kind === 'metric',
  );

  return rows.map((row) => {
    const nextRow = { ...row };

    rules
      .filter((rule) => rule.tableId === table.id)
      .forEach((rule) => {
        const target = resolveMetricColumn(table, rule.targetMetricColumnId);
        if (!target) {
          onWarning?.(`Regel ${rule.id}: Zielkennzahl wurde nicht gefunden.`);
          return;
        }

        if (!rule.when.every((condition) => matchesCondition(nextRow, condition, table))) {
          return;
        }

        const probability = resolveApplicationProbability(
          rule.applicationProbability,
          rule.effect.probabilityAdjustment,
        );

        if (Math.random() > probability) {
          return;
        }

        const currentValue = nextRow[target.columnName];
        if (typeof currentValue !== 'number') {
          onWarning?.(`Regel ${rule.id}: Zielwert in Spalte ${target.columnName} ist nicht numerisch.`);
          return;
        }

        let candidateValue = currentValue;
        if (rule.effect.offset !== undefined) {
          candidateValue += rule.effect.offset;
        }

        if (rule.effect.multiplier !== undefined) {
          candidateValue *= rule.effect.multiplier;
        }

        nextRow[target.columnName] = clampMetricValue(candidateValue, target.column, (warning) => {
          onWarning?.(`Regel ${rule.id}: ${warning.message}`);
        });
      });

    clampMetricColumnsInRow(nextRow, metricColumns, (warning) => {
      onWarning?.(`Finales Clamping (${table.name}.${warning.columnId}): ${warning.message}`);
    });

    return nextRow;
  });
}

function buildSourceIndex(
  rows: Record<string, string | number>[],
  sourceJoinColumns: string[],
): Map<string, Record<string, string | number>[]> {
  const index = new Map<string, Record<string, string | number>[]>();

  rows.forEach((row) => {
    const key = sourceJoinColumns.map((columnName) => row[columnName]).join('|');
    const bucket = index.get(key);

    if (bucket) {
      bucket.push(row);
      return;
    }

    index.set(key, [row]);
  });

  return index;
}

export function applyCrossTableCorrelations(
  sourceRows: Record<string, string | number>[],
  targetRows: Record<string, string | number>[],
  sourceTable: TableConfig,
  targetTable: TableConfig,
  rules: CrossTableCorrelationRule[],
  onWarning?: CorrelationWarningHandler,
): Record<string, string | number>[] {
  const targetMetricColumns = targetTable.columns.filter(
    (column): column is MetricColumnConfig => column.kind === 'metric',
  );

  return rules
    .filter((rule) => rule.sourceTableId === sourceTable.id && rule.targetTableId === targetTable.id)
    .reduce((rows, rule) => {
      const sourceMetric = resolveMetricColumn(sourceTable, rule.sourceMetricColumnId);
      const targetMetric = resolveMetricColumn(targetTable, rule.targetMetricColumnId);

      if (!sourceMetric || !targetMetric) {
        onWarning?.(`Regel ${rule.id}: Quell- oder Zielkennzahl fehlt.`);
        return rows;
      }

      const sourceJoinColumns = rule.joinColumns
        .map((join) => getColumnNameById(sourceTable, join.sourceColumnId))
        .filter((value): value is string => Boolean(value));
      const targetJoinColumns = rule.joinColumns
        .map((join) => getColumnNameById(targetTable, join.targetColumnId))
        .filter((value): value is string => Boolean(value));

      if (sourceJoinColumns.length !== rule.joinColumns.length || targetJoinColumns.length !== rule.joinColumns.length) {
        onWarning?.(`Regel ${rule.id}: Join-Spalten konnten nicht vollständig aufgelöst werden.`);
        return rows;
      }

      const sourceIndex = buildSourceIndex(sourceRows, sourceJoinColumns);

      return rows.map((row) => {
        const nextRow = { ...row };
        const key = targetJoinColumns.map((columnName) => row[columnName]).join('|');
        const matchingRows = sourceIndex.get(key);

        if (!matchingRows || matchingRows.length === 0) {
          return nextRow;
        }

        const averageSourceMetric =
          matchingRows.reduce((sum, sourceRow) => {
            const value = sourceRow[sourceMetric.columnName];
            return typeof value === 'number' ? sum + value : sum;
          }, 0) / matchingRows.length;

        const currentTargetValue = nextRow[targetMetric.columnName];
        if (typeof currentTargetValue !== 'number') {
          onWarning?.(`Regel ${rule.id}: Zielwert ${targetMetric.columnName} ist nicht numerisch.`);
          return nextRow;
        }

        const influencedValue =
          currentTargetValue + averageSourceMetric * rule.influenceFactor + (rule.influenceOffset ?? 0);

        nextRow[targetMetric.columnName] = clampMetricValue(influencedValue, targetMetric.column, (warning) => {
          onWarning?.(`Regel ${rule.id}: ${warning.message}`);
        });

        clampMetricColumnsInRow(nextRow, targetMetricColumns, (warning) => {
          onWarning?.(`Finales Clamping (${targetTable.name}.${warning.columnId}): ${warning.message}`);
        });

        return nextRow;
      });
    }, targetRows);
}
