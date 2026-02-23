import { ColumnEditor } from './components/ColumnEditor';
import { ColumnList } from './components/ColumnList';
import { useProjectStore } from '../../state/projectStore';

export function ColumnsPanel() {
  const tables = useProjectStore((state) => state.tables);
  const activeTableId = useProjectStore((state) => state.activeTableId);
  const addColumn = useProjectStore((state) => state.addColumn);
  const updateColumn = useProjectStore((state) => state.updateColumn);

  const activeTable = tables.find((table) => table.id === activeTableId);

  return (
    <section className="panel">
      <h3>Spaltendefinitionen</h3>
      <p>Zieltabelle: {activeTable?.name ?? 'keine'}</p>

      {activeTable && (
        <>
          <ColumnEditor
            activeTableId={activeTable.id}
            tables={tables}
            onSave={(column) => addColumn(activeTable.id, column)}
          />

          <h4>Vorhandene Spalten</h4>
          <ColumnList
            activeTable={activeTable}
            tables={tables}
            onUpdateColumn={(column) => updateColumn(activeTable.id, column)}
          />
        </>
      )}
    </section>
  );
}
