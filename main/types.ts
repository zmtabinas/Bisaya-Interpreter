export type Value = number | string | boolean;
export interface Variable {
  type: 'NUMERO' | 'LETRA' | 'TINUOD' | 'TIPIK';
  value: Value;
}