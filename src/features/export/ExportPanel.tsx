import { useProjectStore } from '../../state/projectStore';
import { createTablesZip, rowsToCsv } from './zipExport';

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const projectName = useProjectStore((state) => state.projectName);
  const tables = useProjectStore((state) => state.tables);
  const activeTableId = useProjectStore((state) => state.activeTableId);
  const previewRows = useProjectStore((state) => state.previewRows);
  const generatedRowsByTableId = useProjectStore((state) => state.generatedRowsByTableId);

  const activeTable = tables.find((table) => table.id === activeTableId);
  const preview = activeTable ? previewRows(activeTable.id, 2) : [];

  function handleDownloadActiveCsv() {
    if (!activeTable) {
      return;
    }

    const rows = generatedRowsByTableId[activeTable.id] ?? [];
    const csv = rowsToCsv(rows);
    downloadBlob(`${activeTable.name}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  }

  function handleExportAllTables() {
    const zip = createTablesZip(tables, generatedRowsByTableId);
    downloadBlob(`${projectName.replace(/\s+/g, '_') || 'projekt'}_csv_export.zip`, zip);
  }

  return (
    <section className="panel">
      <h3>Export (CSV / ZIP / Projekt-JSON)</h3>
      <p>Projekt: {projectName}</p>
      <p>Tabelle im Fokus: {activeTable?.name ?? 'keine'}</p>
      <button type="button" onClick={handleDownloadActiveCsv} disabled={!activeTable}>
        CSV herunterladen
      </button>
      <button type="button" onClick={handleExportAllTables}>
        Alle Tabellen exportieren
      </button>
      <pre>{JSON.stringify(preview, null, 2)}</pre>
    </section>
  );
}
