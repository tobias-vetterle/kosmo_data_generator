import { useState } from 'react';
import { useProjectStore } from '../../state/projectStore';

export function CorrelationsPanel() {
  const correlations = useProjectStore((state) => state.correlations);
  const addCorrelation = useProjectStore((state) => state.addCorrelation);
  const [rule, setRule] = useState('');

  return (
    <section className="panel">
      <h3>Regel- und Korrelationseditor</h3>
      <ul>
        {correlations.map((correlation) => (
          <li key={correlation.id}>{correlation.description}</li>
        ))}
      </ul>
      <input
        value={rule}
        onChange={(event) => setRule(event.target.value)}
        placeholder="z. B. kunden.land = adressen.land"
      />
      <button
        type="button"
        onClick={() => {
          if (!rule.trim()) return;
          addCorrelation(rule.trim());
          setRule('');
        }}
      >
        Regel speichern
      </button>
    </section>
  );
}
