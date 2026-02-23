import { useProjectStore } from '../../state/projectStore';

export function ExportPanel() {
  const projectName = useProjectStore((state) => state.projectName);
  const firstTable = useProjectStore((state) => state.tables[0]);
  const previewRows = useProjectStore((state) => state.previewRows);

  const preview = firstTable ? previewRows(firstTable.id, 2) : [];

  return (
    <section className="panel">
      <h3>Export (CSV / ZIP / Projekt-JSON)</h3>
      <p>Projekt: {projectName}</p>
      <p>Export-Pipeline als nächster Schritt vorgesehen.</p>
      <pre>{JSON.stringify(preview, null, 2)}</pre>
    </section>
  );
}
