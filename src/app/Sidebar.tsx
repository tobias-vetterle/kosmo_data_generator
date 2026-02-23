import { useProjectStore } from '../state/projectStore';

export function Sidebar() {
  const tableCount = useProjectStore((state) => state.tables.length);

  return (
    <aside className="sidebar">
      <h1>KOSMO - Synthetischer Datengenerator</h1>
      <p>Tabellen im Projekt: {tableCount}</p>
    </aside>
  );
}
