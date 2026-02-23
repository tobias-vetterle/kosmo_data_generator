import { useState } from 'react';
import type { ColumnDefinition, TableDefinition } from '../../../state/projectStore';
import { ColumnEditor } from './ColumnEditor';

type ColumnListProps = {
  activeTable: TableDefinition;
  tables: TableDefinition[];
  onUpdateColumn: (column: ColumnDefinition) => void;
};

function describeColumn(column: ColumnDefinition) {
  if (column.kind === 'dimension') {
    return `Dimension${column.isTimeDimension ? ' • Zeitdimension' : ''}`;
  }

  if (column.distribution.type === 'uniform') {
    return `Kennzahl • ${column.dataType} • Uniform [${column.distribution.min ?? '-'}..${column.distribution.max ?? '-'}]`;
  }

  return `Kennzahl • ${column.dataType} • Normal μ=${column.distribution.mean}, σ=${column.distribution.stdDev}`;
}

export function ColumnList({ activeTable, tables, onUpdateColumn }: ColumnListProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  if (!activeTable.columns.length) {
    return <p>Noch keine Spalten angelegt.</p>;
  }

  return (
    <ul className="column-list">
      {activeTable.columns.map((column) => {
        const isEditing = editingColumnId === column.id;

        return (
          <li key={column.id} className="column-card">
            <div className="column-card-header">
              <div>
                <strong>{column.name}</strong>
                <p>{describeColumn(column)}</p>
              </div>
              <button type="button" onClick={() => setEditingColumnId(isEditing ? null : column.id)}>
                {isEditing ? 'Schließen' : 'Bearbeiten'}
              </button>
            </div>

            {isEditing && (
              <ColumnEditor
                activeTableId={activeTable.id}
                tables={tables}
                initialColumn={column}
                onSave={(nextColumn) => {
                  onUpdateColumn(nextColumn);
                  setEditingColumnId(null);
                }}
                onCancel={() => setEditingColumnId(null)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
