import { useMemo, useState } from 'react';
import type {
  ColumnDefinition,
  DistributionConfig,
  TableDefinition,
} from '../../../state/projectStore';

type ColumnEditorProps = {
  activeTableId: string;
  tables: TableDefinition[];
  initialColumn?: ColumnDefinition;
  onSave: (column: ColumnDefinition) => void;
  onCancel?: () => void;
};

type DistributionMode = DistributionConfig['type'];

function toNumberOrUndefined(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildSharedSource(
  enabled: boolean,
  tableId: string,
  columnId: string,
): ColumnDefinition['sharedRef'] {
  if (!enabled || !tableId || !columnId) return undefined;
  return { sourceTableId: tableId, sourceColumnId: columnId };
}

export function ColumnEditor({ activeTableId, tables, initialColumn, onSave, onCancel }: ColumnEditorProps) {
  const isEditMode = Boolean(initialColumn);

  const [name, setName] = useState(initialColumn?.name ?? '');
  const [kind, setKind] = useState<ColumnDefinition['kind']>(initialColumn?.kind ?? 'dimension');

  const [isTimeDimension, setIsTimeDimension] = useState(
    initialColumn?.kind === 'dimension' ? Boolean(initialColumn.isTimeDimension) : false,
  );
  const [categories, setCategories] = useState(
    initialColumn?.kind === 'dimension' && initialColumn.categories?.length
      ? initialColumn.categories
      : [{ id: crypto.randomUUID(), label: '', weight: 1 }],
  );

  const [dataType, setDataType] = useState(initialColumn?.kind === 'metric' ? initialColumn.dataType : 'int');
  const [distributionMode, setDistributionMode] = useState<DistributionMode>(
    initialColumn?.kind === 'metric' ? initialColumn.distribution.type : 'uniform',
  );

  const [uniformMin, setUniformMin] = useState(
    initialColumn?.kind === 'metric' && initialColumn.distribution.type === 'uniform'
      ? String(initialColumn.distribution.min ?? '')
      : '0',
  );
  const [uniformMax, setUniformMax] = useState(
    initialColumn?.kind === 'metric' && initialColumn.distribution.type === 'uniform'
      ? String(initialColumn.distribution.max ?? '')
      : '100',
  );

  const [normalMean, setNormalMean] = useState(
    initialColumn?.kind === 'metric' && initialColumn.distribution.type === 'normal'
      ? String(initialColumn.distribution.mean)
      : '0',
  );
  const [normalStdDev, setNormalStdDev] = useState(
    initialColumn?.kind === 'metric' && initialColumn.distribution.type === 'normal'
      ? String(initialColumn.distribution.stdDev)
      : '1',
  );
  const [normalMin, setNormalMin] = useState(
    initialColumn?.kind === 'metric' && initialColumn.distribution.type === 'normal'
      ? String(initialColumn.distribution.min ?? '')
      : '',
  );
  const [normalMax, setNormalMax] = useState(
    initialColumn?.kind === 'metric' && initialColumn.distribution.type === 'normal'
      ? String(initialColumn.distribution.max ?? '')
      : '',
  );

  const [sharedEnabled, setSharedEnabled] = useState(Boolean(initialColumn?.sharedRef));
  const [sharedTableId, setSharedTableId] = useState(initialColumn?.sharedRef?.sourceTableId ?? '');
  const [sharedColumnId, setSharedColumnId] = useState(initialColumn?.sharedRef?.sourceColumnId ?? '');

  const sourceTableOptions = useMemo(
    () => tables.filter((table) => table.id !== activeTableId),
    [activeTableId, tables],
  );

  const sourceColumns = useMemo(() => {
    const sourceTable = tables.find((table) => table.id === sharedTableId);
    return sourceTable?.columns ?? [];
  }, [sharedTableId, tables]);

  const saveColumn = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (kind === 'dimension') {
      const nextColumn: ColumnDefinition = {
        id: initialColumn?.id ?? crypto.randomUUID(),
        name: trimmedName,
        kind: 'dimension',
        isTimeDimension,
        categories: categories
          .map((category) => ({
            ...category,
            label: category.label.trim(),
            weight: category.weight,
          }))
          .filter((category) => category.label),
        sharedRef: buildSharedSource(sharedEnabled, sharedTableId, sharedColumnId),
      };
      onSave(nextColumn);
      return;
    }

    const distribution: DistributionConfig =
      distributionMode === 'uniform'
        ? {
            type: 'uniform',
            min: toNumberOrUndefined(uniformMin),
            max: toNumberOrUndefined(uniformMax),
          }
        : {
            type: 'normal',
            mean: toNumberOrUndefined(normalMean) ?? 0,
            stdDev: toNumberOrUndefined(normalStdDev) ?? 1,
            min: toNumberOrUndefined(normalMin),
            max: toNumberOrUndefined(normalMax),
          };

    const nextColumn: ColumnDefinition = {
      id: initialColumn?.id ?? crypto.randomUUID(),
      name: trimmedName,
      kind: 'metric',
      dataType,
      distribution,
      sharedRef: buildSharedSource(sharedEnabled, sharedTableId, sharedColumnId),
    };

    onSave(nextColumn);
  };

  return (
    <div className="column-editor">
      <div className="field-grid">
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="z. B. umsatz" />
        </label>

        <label>
          Typ
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as ColumnDefinition['kind'])}
          >
            <option value="dimension">Dimension</option>
            <option value="metric">Kennzahl</option>
          </select>
        </label>
      </div>

      {kind === 'dimension' && (
        <div className="column-section">
          <label className="inline-check">
            <input
              type="checkbox"
              checked={isTimeDimension}
              onChange={(event) => setIsTimeDimension(event.target.checked)}
            />
            Zeitdimension
          </label>

          <div>
            <strong>Ausprägungen</strong>
            <div className="item-grid">
              {categories.map((category, index) => (
                <div key={category.id} className="item-row">
                  <input
                    value={category.label}
                    onChange={(event) => {
                      const next = [...categories];
                      next[index] = { ...next[index], label: event.target.value };
                      setCategories(next);
                    }}
                    placeholder="Label"
                  />
                  <input
                    value={category.weight ?? ''}
                    onChange={(event) => {
                      const next = [...categories];
                      next[index] = {
                        ...next[index],
                        weight: toNumberOrUndefined(event.target.value),
                      };
                      setCategories(next);
                    }}
                    type="number"
                    step="0.1"
                    placeholder="Gewicht"
                  />
                  <button
                    type="button"
                    onClick={() => setCategories(categories.filter((entry) => entry.id !== category.id))}
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setCategories([...categories, { id: crypto.randomUUID(), label: '', weight: 1 }])
              }
            >
              Ausprägung hinzufügen
            </button>
          </div>
        </div>
      )}

      {kind === 'metric' && (
        <div className="column-section">
          <div className="field-grid">
            <label>
              Datentyp
              <select value={dataType} onChange={(event) => setDataType(event.target.value as 'int' | 'float')}>
                <option value="int">Ganzzahl</option>
                <option value="float">Float</option>
              </select>
            </label>

            <label>
              Verteilung
              <select
                value={distributionMode}
                onChange={(event) => setDistributionMode(event.target.value as DistributionMode)}
              >
                <option value="uniform">Uniform</option>
                <option value="normal">Normal</option>
              </select>
            </label>
          </div>

          {distributionMode === 'uniform' ? (
            <div className="field-grid">
              <label>
                Min
                <input type="number" value={uniformMin} onChange={(event) => setUniformMin(event.target.value)} />
              </label>
              <label>
                Max
                <input type="number" value={uniformMax} onChange={(event) => setUniformMax(event.target.value)} />
              </label>
            </div>
          ) : (
            <div className="field-grid">
              <label>
                Mittelwert
                <input type="number" value={normalMean} onChange={(event) => setNormalMean(event.target.value)} />
              </label>
              <label>
                Stdabw
                <input type="number" value={normalStdDev} onChange={(event) => setNormalStdDev(event.target.value)} />
              </label>
              <label>
                Clamp Min
                <input type="number" value={normalMin} onChange={(event) => setNormalMin(event.target.value)} />
              </label>
              <label>
                Clamp Max
                <input type="number" value={normalMax} onChange={(event) => setNormalMax(event.target.value)} />
              </label>
            </div>
          )}
        </div>
      )}

      <div className="column-section">
        <label className="inline-check">
          <input
            type="checkbox"
            checked={sharedEnabled}
            onChange={(event) => setSharedEnabled(event.target.checked)}
          />
          Werte aus anderer Tabelle übernehmen
        </label>

        {sharedEnabled && (
          <div className="field-grid">
            <label>
              Tabelle
              <select
                value={sharedTableId}
                onChange={(event) => {
                  setSharedTableId(event.target.value);
                  setSharedColumnId('');
                }}
              >
                <option value="">Bitte auswählen</option>
                {sourceTableOptions.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Spalte
              <select value={sharedColumnId} onChange={(event) => setSharedColumnId(event.target.value)}>
                <option value="">Bitte auswählen</option>
                {sourceColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="actions-row">
        <button type="button" onClick={saveColumn}>
          {isEditMode ? 'Änderung speichern' : 'Spalte anlegen'}
        </button>
        {onCancel && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
}
