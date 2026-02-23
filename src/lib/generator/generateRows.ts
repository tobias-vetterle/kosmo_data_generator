import type { TableDefinition } from '../../state/projectStore';
import { generateTableRows } from './generateTable';

export function generateRows(
  table: TableDefinition,
  count: number,
): Record<string, string | number>[] {
  return generateTableRows(table, count);
}
