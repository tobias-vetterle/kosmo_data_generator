import type {
  ColumnConfig,
  CorrelationRule,
  DistributionConfig,
  ProjectConfig,
  RelationConfig,
  SharedColumnRef,
  TableConfig,
} from './models';

export type ValidationIssue = {
  path: string;
  message: string;
};

export function validateProjectConfig(config: ProjectConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const tableById = new Map(config.tables.map((table) => [table.id, table]));

  validateUniqueTableNames(config.tables, issues);

  config.tables.forEach((table, tableIndex) => {
    const columnById = new Map(table.columns.map((column) => [column.id, column]));

    table.columns.forEach((column, columnIndex) => {
      validateSharedReference(column.sharedRef, tableById, issues, `tables[${tableIndex}].columns[${columnIndex}]`);
      validateMinMaxConsistency(column, issues, `tables[${tableIndex}].columns[${columnIndex}]`);

      if (column.kind === 'dimension' && column.categories) {
        column.categories.forEach((category, categoryIndex) => {
          if (category.weight !== undefined && category.weight < 0) {
            issues.push({
              path: `tables[${tableIndex}].columns[${columnIndex}].categories[${categoryIndex}].weight`,
              message: 'Kategoriegewicht darf nicht negativ sein.',
            });
          }
        });
      }
    });

    if (columnById.size !== table.columns.length) {
      issues.push({
        path: `tables[${tableIndex}].columns`,
        message: 'Spalten-IDs innerhalb einer Tabelle müssen eindeutig sein.',
      });
    }
  });

  config.relations.forEach((relation, relationIndex) => {
    validateRelation(relation, tableById, issues, `relations[${relationIndex}]`);
  });

  config.correlationRules.forEach((rule, ruleIndex) => {
    validateCorrelationRule(rule, tableById, issues, `correlationRules[${ruleIndex}]`);
  });

  return issues;
}

export function assertValidProjectConfig(config: ProjectConfig): void {
  const issues = validateProjectConfig(config);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
  }
}

function validateUniqueTableNames(tables: TableConfig[], issues: ValidationIssue[]): void {
  const seen = new Set<string>();

  tables.forEach((table, tableIndex) => {
    const normalizedName = table.name.trim().toLowerCase();
    if (seen.has(normalizedName)) {
      issues.push({
        path: `tables[${tableIndex}].name`,
        message: `Tabellenname "${table.name}" ist nicht eindeutig.`,
      });
      return;
    }

    seen.add(normalizedName);
  });
}

function validateSharedReference(
  sharedRef: SharedColumnRef | undefined,
  tableById: Map<string, TableConfig>,
  issues: ValidationIssue[],
  path: string,
): void {
  if (!sharedRef) {
    return;
  }

  const sourceTable = tableById.get(sharedRef.sourceTableId);
  if (!sourceTable) {
    issues.push({
      path: `${path}.sharedRef.sourceTableId`,
      message: `Quelltabelle "${sharedRef.sourceTableId}" wurde nicht gefunden.`,
    });
    return;
  }

  const sourceColumn = sourceTable.columns.find((column) => column.id === sharedRef.sourceColumnId);
  if (!sourceColumn) {
    issues.push({
      path: `${path}.sharedRef.sourceColumnId`,
      message: `Quellspalte "${sharedRef.sourceColumnId}" wurde nicht gefunden.`,
    });
  }
}

function validateRelation(
  relation: RelationConfig,
  tableById: Map<string, TableConfig>,
  issues: ValidationIssue[],
  path: string,
): void {
  const leftTable = tableById.get(relation.leftTableId);
  const rightTable = tableById.get(relation.rightTableId);

  if (!leftTable) {
    issues.push({
      path: `${path}.leftTableId`,
      message: `Tabelle "${relation.leftTableId}" wurde nicht gefunden.`,
    });
  }

  if (!rightTable) {
    issues.push({
      path: `${path}.rightTableId`,
      message: `Tabelle "${relation.rightTableId}" wurde nicht gefunden.`,
    });
  }

  if (!leftTable || !rightTable) {
    return;
  }

  relation.joinKeys.forEach((joinKey, joinIndex) => {
    const leftColumn = leftTable.columns.find((column) => column.id === joinKey.leftColumnId);
    const rightColumn = rightTable.columns.find((column) => column.id === joinKey.rightColumnId);

    if (!leftColumn) {
      issues.push({
        path: `${path}.joinKeys[${joinIndex}].leftColumnId`,
        message: `Join-Spalte "${joinKey.leftColumnId}" wurde nicht gefunden.`,
      });
    }

    if (!rightColumn) {
      issues.push({
        path: `${path}.joinKeys[${joinIndex}].rightColumnId`,
        message: `Join-Spalte "${joinKey.rightColumnId}" wurde nicht gefunden.`,
      });
    }

    if (leftColumn && rightColumn && !areColumnsCompatible(leftColumn, rightColumn)) {
      issues.push({
        path: `${path}.joinKeys[${joinIndex}]`,
        message: 'Join-Spalten sind nicht kompatibel.',
      });
    }
  });
}

function validateMinMaxConsistency(
  column: ColumnConfig,
  issues: ValidationIssue[],
  path: string,
): void {
  if (column.kind !== 'metric') {
    return;
  }

  validateDistributionRange(column.distribution, issues, `${path}.distribution`);
}

function validateDistributionRange(
  distribution: DistributionConfig,
  issues: ValidationIssue[],
  path: string,
): void {
  if (
    distribution.min !== undefined &&
    distribution.max !== undefined &&
    distribution.min > distribution.max
  ) {
    issues.push({
      path,
      message: 'Verteilung: min darf nicht größer als max sein.',
    });
  }

  if (distribution.type === 'normal') {
    if (distribution.stdDev <= 0) {
      issues.push({
        path: `${path}.stdDev`,
        message: 'Standardabweichung muss größer als 0 sein.',
      });
    }
  }
}

function validateCorrelationRule(
  rule: CorrelationRule,
  tableById: Map<string, TableConfig>,
  issues: ValidationIssue[],
  path: string,
): void {
  if (rule.type === 'intra-table') {
    const table = tableById.get(rule.tableId);
    if (!table) {
      issues.push({ path: `${path}.tableId`, message: `Tabelle "${rule.tableId}" wurde nicht gefunden.` });
      return;
    }

    validateColumnExists(table, rule.sourceColumnId, `${path}.sourceColumnId`, issues);
    validateColumnExists(table, rule.targetColumnId, `${path}.targetColumnId`, issues);
    return;
  }

  const sourceTable = tableById.get(rule.sourceTableId);
  const targetTable = tableById.get(rule.targetTableId);

  if (!sourceTable) {
    issues.push({
      path: `${path}.sourceTableId`,
      message: `Quelltabelle "${rule.sourceTableId}" wurde nicht gefunden.`,
    });
  }

  if (!targetTable) {
    issues.push({
      path: `${path}.targetTableId`,
      message: `Zieltabelle "${rule.targetTableId}" wurde nicht gefunden.`,
    });
  }

  if (!sourceTable || !targetTable) {
    return;
  }

  validateColumnExists(sourceTable, rule.sourceColumnId, `${path}.sourceColumnId`, issues);
  validateColumnExists(targetTable, rule.targetColumnId, `${path}.targetColumnId`, issues);
}

function validateColumnExists(
  table: TableConfig,
  columnId: string,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!table.columns.some((column) => column.id === columnId)) {
    issues.push({
      path,
      message: `Spalte "${columnId}" wurde in Tabelle "${table.name}" nicht gefunden.`,
    });
  }
}

function areColumnsCompatible(left: ColumnConfig, right: ColumnConfig): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === 'metric' && right.kind === 'metric') {
    return left.dataType === right.dataType;
  }

  return true;
}
