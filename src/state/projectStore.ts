import { create } from 'zustand';
import { generateRows } from '../lib/generator/generateRows';

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

export type ColumnDefinition =
  | {
      id: string;
      name: string;
      kind: 'dimension';
      categories?: DimensionCategory[];
      isTimeDimension?: boolean;
      sharedRef?: SharedColumnRef;
    }
  | {
      id: string;
      name: string;
      kind: 'metric';
      dataType: MetricDataType;
      distribution: DistributionConfig;
      sharedRef?: SharedColumnRef;
    };

export type TableKind = 'aggregat' | 'individual';

export type TableDefinition = {
  id: string;
  name: string;
  type: TableKind;
  columns: ColumnDefinition[];
};

export type CorrelationRule = {
  id: string;
  description: string;
};

export type ProjectConfiguration = {
  projectName: string;
  activeTableId: string | null;
  tables: TableDefinition[];
  correlations: CorrelationRule[];
};

type ProjectState = ProjectConfiguration & {
  addTable: (name: string, type: TableKind) => void;
  deleteTable: (tableId: string) => void;
  duplicateTable: (tableId: string) => void;
  setActiveTable: (tableId: string) => void;
  importProjectConfiguration: (config: ProjectConfiguration) => void;
  addColumn: (tableId: string, column: ColumnDefinition) => void;
  updateColumn: (tableId: string, column: ColumnDefinition) => void;
  addCorrelation: (description: string) => void;
  previewRows: (tableId: string, count: number) => Record<string, string | number>[];
};

const initialTable: TableDefinition = { id: 'table-1', name: 'kunden', type: 'individual', columns: [] };

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Neues KOSMO Projekt',
  activeTableId: initialTable.id,
  tables: [initialTable],
  correlations: [],
  addTable: (name, type) => {
    const tableId = crypto.randomUUID();
    set((state) => ({
      tables: [...state.tables, { id: tableId, name, type, columns: [] }],
      activeTableId: tableId,
    }));
  },
  deleteTable: (tableId) => {
    set((state) => {
      const nextTables = state.tables.filter((table) => table.id !== tableId);
      const nextActive =
        state.activeTableId === tableId ? (nextTables[0]?.id ?? null) : state.activeTableId;

      return {
        tables: nextTables,
        activeTableId: nextActive,
      };
    });
  },
  duplicateTable: (tableId) => {
    const source = get().tables.find((table) => table.id === tableId);
    if (!source) return;

    const duplicatedTable: TableDefinition = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} (Kopie)`,
      columns: source.columns.map((column) => ({ ...column, id: crypto.randomUUID() })),
    };

    set((state) => ({
      tables: [...state.tables, duplicatedTable],
      activeTableId: duplicatedTable.id,
    }));
  },
  setActiveTable: (tableId) => {
    set({ activeTableId: tableId });
  },
  importProjectConfiguration: (config) => {
    const fallbackId = config.tables[0]?.id ?? null;
    const hasActiveId = config.activeTableId
      ? config.tables.some((table) => table.id === config.activeTableId)
      : false;

    set({
      projectName: config.projectName,
      tables: config.tables,
      correlations: config.correlations,
      activeTableId: hasActiveId ? config.activeTableId : fallbackId,
    });
  },
  addColumn: (tableId, column) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId ? { ...table, columns: [...table.columns, column] } : table,
      ),
    }));
  },
  updateColumn: (tableId, column) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((entry) => (entry.id === column.id ? column : entry)),
            }
          : table,
      ),
    }));
  },
  addCorrelation: (description) => {
    set((state) => ({
      correlations: [...state.correlations, { id: crypto.randomUUID(), description }],
    }));
  },
  previewRows: (tableId, count) => {
    const table = get().tables.find((entry) => entry.id === tableId);
    return table ? generateRows(table, count) : [];
  },
}));
