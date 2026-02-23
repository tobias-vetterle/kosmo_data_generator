import { useProjectStore } from '../../state/projectStore';

export function ExportPanel() {
  const projectName = useProjectStore((state) => state.projectName);
  const tables = useProjectStore((state) => state.tables);
  const activeTableId = useProjectStore((state) => state.activeTableId);
  const previewRows = useProjectStore((state) => state.previewRows);

  const activeTable = tables.find((table) => table.id === activeTableId);
  const preview = activeTable ? previewRows(activeTable.id, 2) : [];

  return (
    <section className="panel">
      <h3>Export (CSV / ZIP / Projekt-JSON)</h3>
      <p>Projekt: {projectName}</p>
      <p>Tabelle im Fokus: {activeTable?.name ?? 'keine'}</p>
      <pre>{JSON.stringify(preview, null, 2)}</pre>
    </section>
  );
}
