import { useState } from 'react';
import { useProjectStore } from '../../state/projectStore';

export function ColumnsPanel() {
  const firstTable = useProjectStore((state) => state.tables[0]);
  const addColumn = useProjectStore((state) => state.addColumn);
  const [name, setName] = useState('id');

  return (
    <section className="panel">
      <h3>Spaltendefinitionen</h3>
      <p>Zieltabelle: {firstTable?.name ?? 'keine'}</p>
      <ul>
        {firstTable?.columns.map((column) => (
          <li key={column.id}>
            {column.name} ({column.type})
          </li>
        ))}
      </ul>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button
        type="button"
        onClick={() => {
          if (!firstTable || !name.trim()) return;
          addColumn(firstTable.id, {
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
