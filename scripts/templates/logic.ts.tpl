/**
 * {{name}} — pure functions, no UI.
 * Formula and reference examples: docs/briefs/{{slug}}.md §3.
 */

export interface {{island}}Input {
  // TODO: fields from the brief's field specification
  value: number;
}

export interface {{island}}Result {
  // TODO
  result: number;
  steps: { label: string; expression: string; value: string }[];
}

export const DEFAULT_INPUT: {{island}}Input = { value: 1 };

export function calculate(input: {{island}}Input): {{island}}Result {
  const result = input.value;
  return { result, steps: [{ label: 'Result', expression: String(input.value), value: String(result) }] };
}
