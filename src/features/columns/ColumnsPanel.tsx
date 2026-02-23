import { useState } from 'react';
import { useProjectStore } from '../../state/projectStore';

export function ColumnsPanel() {
  const tables = useProjectStore((state) => state.tables);
  const activeTableId = useProjectStore((state) => state.activeTableId);
  const addColumn = useProjectStore((state) => state.addColumn);
  const [name, setName] = useState('id');

  const activeTable = tables.find((table) => table.id === activeTableId);

  return (
    <section className="panel">
      <h3>Spaltendefinitionen</h3>
      <p>Zieltabelle: {activeTable?.name ?? 'keine'}</p>
      <ul>
        {activeTable?.columns.map((column) => (
          <li key={column.id}>
            {column.name} ({column.type})
          </li>
        ))}
      </ul>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button
        type="button"
        onClick={() => {
          if (!activeTable || !name.trim()) return;
          addColumn(activeTable.id, {
            id: crypto.randomUUID(),
            name: name.trim(),
            type: 'string',
          });
        }}
      >
        Spalte anlegen
      </button>
    </section>
  );
}
