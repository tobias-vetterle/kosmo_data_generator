import { create } from 'zustand';
import { generateRows } from '../lib/generator/generateRows';

export type ColumnDefinition = {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
};

export type TableDefinition = {
  id: string;
  name: string;
  columns: ColumnDefinition[];
};

export type CorrelationRule = {
  id: string;
  description: string;
};

type ProjectState = {
  projectName: string;
  tables: TableDefinition[];
  correlations: CorrelationRule[];
  addTable: (name: string) => void;
  addColumn: (tableId: string, column: ColumnDefinition) => void;
  addCorrelation: (description: string) => void;
  previewRows: (tableId: string, count: number) => Record<string, string | number>[];
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Neues KOSMO Projekt',
  tables: [{ id: 'table-1', name: 'kunden', columns: [] }],
  correlations: [],
  addTable: (name) => {
    set((state) => ({
      tables: [...state.tables, { id: crypto.randomUUID(), name, columns: [] }],
    }));
  },
  addColumn: (tableId, column) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId ? { ...table, columns: [...table.columns, column] } : table,
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
