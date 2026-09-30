import { describe, it, expect } from 'vitest';
import { calculate, DEFAULT_INPUT } from './logic';

// ≥ 5 reference examples from docs/briefs/{{slug}}.md §3, ≥ 2 from a primary source.
describe('{{name}} reference examples', () => {
  it('#1 default example', () => {
    expect(calculate(DEFAULT_INPUT).result).toBe(1);
  });
  it.todo('#2 primary source example');
  it.todo('#3 primary source example');
  it.todo('#4 competitor cross-check');
  it.todo('#5 competitor cross-check');
});

describe('edge cases', () => {
  it.todo('zero input');
  it.todo('negative input is rejected');
  it.todo('very large input stays finite');
});
