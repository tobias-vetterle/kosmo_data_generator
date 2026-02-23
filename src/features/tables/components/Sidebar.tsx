import { useMemo, useState } from 'react';
import {
  type ProjectConfiguration,
  type TableKind,
  useProjectStore,
} from '../../../state/projectStore';
import { createZip } from '../../../lib/export/createZip';

const acceptedTableTypes: TableKind[] = ['aggregat', 'individual'];

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Sidebar() {
  const projectName = useProjectStore((state) => state.projectName);
  const activeTableId = useProjectStore((state) => state.activeTableId);
  const tables = useProjectStore((state) => state.tables);
  const correlations = useProjectStore((state) => state.correlations);
  const addTable = useProjectStore((state) => state.addTable);
  const deleteTable = useProjectStore((state) => state.deleteTable);
  const duplicateTable = useProjectStore((state) => state.duplicateTable);
  const setActiveTable = useProjectStore((state) => state.setActiveTable);
  const importProjectConfiguration = useProjectStore((state) => state.importProjectConfiguration);

  const [isCreateFormOpen, setCreateFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TableKind>('individual');
  const [isProjectIOOpen, setProjectIOOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const projectConfig = useMemo<ProjectConfiguration>(
    () => ({
      projectName,
      activeTableId,
      tables,
      correlations,
    }),
    [activeTableId, correlations, projectName, tables],
  );

  function handleExportAllTables() {
    const content = createZip([
      ...tables.map((table) => ({
        name: `${table.name}.json`,
        content: JSON.stringify(table, null, 2),
      })),
      { name: 'project.json', content: JSON.stringify(projectConfig, null, 2) },
    ]);

    downloadBlob(`${projectName.replace(/\s+/g, '_') || 'projekt'}_tables.zip`, content);
  }

  function handleProjectDownload() {
    const json = JSON.stringify(projectConfig, null, 2);
    downloadBlob(
      `${projectName.replace(/\s+/g, '_') || 'projekt'}_konfiguration.json`,
      new Blob([json], { type: 'application/json' }),
    );
  }

  async function handleProjectUpload(file: File | null) {
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as ProjectConfiguration;

      if (!Array.isArray(parsed.tables) || !Array.isArray(parsed.correlations)) {
        setImportError('Ungültige Projektkonfiguration.');
        return;
      }

      importProjectConfiguration(parsed);
      setImportError(null);
    } catch {
      setImportError('Import fehlgeschlagen: Datei ist kein valides JSON.');
    }
  }

  return (
    <aside className="sidebar">
      <h1>KOSMO - Synthetischer Datengenerator</h1>

      <section className="sidebar-section">
        <button type="button" onClick={() => setCreateFormOpen((open) => !open)}>
          Neue Tabelle
        </button>

        {isCreateFormOpen ? (
          <div className="table-create-form">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tabellenname"
            />
            <select value={type} onChange={(event) => setType(event.target.value as TableKind)}>
              {acceptedTableTypes.map((tableType) => (
                <option key={tableType} value={tableType}>
                  {tableType === 'aggregat' ? 'Aggregat' : 'Individual'}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (!name.trim()) return;
                addTable(name.trim(), type);
                setName('');
                setType('individual');
                setCreateFormOpen(false);
              }}
            >
              Tabelle anlegen
            </button>
          </div>
        ) : null}
      </section>

      <section className="sidebar-section">
        <h2>Tabellen</h2>
        <ul className="table-list">
          {tables.map((table) => (
            <li key={table.id}>
              <button
                type="button"
                className={`table-button ${table.id === activeTableId ? 'active' : ''}`}
                onClick={() => setActiveTable(table.id)}
              >
                <span>{table.name}</span>
                <small>{table.type}</small>
              </button>
              <div className="table-actions">
                <button
                  type="button"
                  title="Tabelle duplizieren"
                  aria-label={`Tabelle ${table.name} duplizieren`}
                  onClick={() => duplicateTable(table.id)}
                >
                  ⧉
                </button>
                <button
                  type="button"
                  title="Tabelle löschen"
                  aria-label={`Tabelle ${table.name} löschen`}
                  onClick={() => deleteTable(table.id)}
                  disabled={tables.length <= 1}
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="sidebar-section">
        <button type="button" onClick={handleExportAllTables}>
          Alle Tabellen exportieren
        </button>
      </section>

      <section className="sidebar-section">
        <button type="button" onClick={() => setProjectIOOpen((open) => !open)}>
          Projekt speichern / laden
        </button>
        {isProjectIOOpen ? (
          <div className="project-io">
            {importError ? <p className="error-text">{importError}</p> : null}
            <button type="button" onClick={handleProjectDownload}>
              Projektkonfiguration als JSON herunterladen
            </button>
            <label className="upload-label">
              Projektkonfiguration importieren
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleProjectUpload(file);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
        ) : null}
      </section>
    </aside>
  );
}
