import { ColumnsPanel } from '../features/columns/ColumnsPanel';
import { CorrelationsPanel } from '../features/correlations/CorrelationsPanel';
import { ExportPanel } from '../features/export/ExportPanel';
import { TablesPanel } from '../features/tables/TablesPanel';

export function Workspace() {
  return (
    <main className="workspace">
      <h2>Arbeitsbereich</h2>
      <div className="workspace-grid">
        <TablesPanel />
        <ColumnsPanel />
        <CorrelationsPanel />
        <ExportPanel />
      </div>
    </main>
  );
}
