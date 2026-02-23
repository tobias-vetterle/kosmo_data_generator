export type TableType = 'individual' | 'aggregate';

export type MetricDataType = 'int' | 'float';

export type DistributionConfig =
  | {
      type: 'uniform';
      min?: number;
      max?: number;
    }
  | {
      type: 'normal';
      mean: number;
      stdDev: number;
      min?: number;
      max?: number;
    };

export type DimensionCategory = {
  id: string;
  label: string;
  weight?: number;
};

export type SharedColumnRef = {
  sourceTableId: string;
  sourceColumnId: string;
};

export type DimensionColumnConfig = {
  id: string;
  name: string;
  kind: 'dimension';
  categories?: DimensionCategory[];
  isTimeDimension?: boolean;
  sharedRef?: SharedColumnRef;
};

export type MetricColumnConfig = {
  id: string;
  name: string;
  kind: 'metric';
  dataType: MetricDataType;
  distribution: DistributionConfig;
  sharedRef?: SharedColumnRef;
};

export type ColumnConfig = DimensionColumnConfig | MetricColumnConfig;

export type JoinKeyConfig = {
  leftColumnId: string;
  rightColumnId: string;
};

export type RelationConfig = {
  id: string;
  leftTableId: string;
  rightTableId: string;
  joinKeys: JoinKeyConfig[];
};

export type IntraTableCorrelationRule = {
  id: string;
  type: 'intra-table';
  tableId: string;
  sourceColumnId: string;
  targetColumnId: string;
  strength: number;
};

export type CrossTableCorrelationRule = {
  id: string;
  type: 'cross-table';
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  strength: number;
};

export type CorrelationRule = IntraTableCorrelationRule | CrossTableCorrelationRule;

export type TableConfig = {
  id: string;
  name: string;
  type: TableType;
  columns: ColumnConfig[];
};

export type ProjectConfig = {
  id: string;
  name: string;
  tables: TableConfig[];
  relations: RelationConfig[];
  correlationRules: CorrelationRule[];
};
