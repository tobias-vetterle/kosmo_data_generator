import { Workspace } from './Workspace';
import { Sidebar } from './Sidebar';

export function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <Workspace />
    </div>
  );
}
