import { useProjectStore } from '../../../state/projectStore';

type TablePreviewProps = {
  tableId: string;
};

export function TablePreview({ tableId }: TablePreviewProps) {
  const rows = useProjectStore((state) => state.previewRows(tableId, 8));

  if (rows.length === 0) {
    return <p>Keine Vorschau verfügbar. Bitte zuerst Tabelle generieren.</p>;
  }

  const columns = Object.keys(rows[0] ?? {});

  return (
    <div>
      <h4>Vorschau</h4>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={`${rowIndex}-${column}`}>{String(row[column] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
