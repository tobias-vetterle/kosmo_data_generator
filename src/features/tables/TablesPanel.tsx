import { TablePreview } from './components/TablePreview';
import { useProjectStore } from '../../state/projectStore';

export function TablesPanel() {
  const activeTableId = useProjectStore((state) => state.activeTableId);
  const tables = useProjectStore((state) => state.tables);
  const generateTableData = useProjectStore((state) => state.generateTableData);

  const activeTable = tables.find((table) => table.id === activeTableId);

  return (
    <section className="panel">
      <h3>Tabellenverwaltung</h3>
      <p>Aktive Tabelle: {activeTable?.name ?? 'keine'}</p>
      <p>Typ: {activeTable?.type ?? '-'}</p>
      <p>Spalten: {activeTable?.columns.length ?? 0}</p>
      <button
        type="button"
        onClick={() => {
          if (!activeTable) {
            return;
          }

          generateTableData(activeTable.id);
        }}
        disabled={!activeTable}
      >
        Tabelle generieren
      </button>
      {activeTable ? <TablePreview tableId={activeTable.id} /> : null}
    </section>
  );
}
