import { useState } from 'react';
import { useProjectStore } from '../../state/projectStore';

export function TablesPanel() {
  const tables = useProjectStore((state) => state.tables);
  const addTable = useProjectStore((state) => state.addTable);
  const [name, setName] = useState('');

  return (
    <section className="panel">
      <h3>Tabellenverwaltung</h3>
      <ul>
        {tables.map((table) => (
          <li key={table.id}>{table.name}</li>
        ))}
      </ul>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Neue Tabelle"
      />
      <button
        type="button"
        onClick={() => {
          if (!name.trim()) return;
          addTable(name.trim());
          setName('');
        }}
      >
        Hinzufügen
      </button>
    </section>
  );
}
