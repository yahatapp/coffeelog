import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function declarations(css) {
  return new Map([...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map((match) => [match[1], match[2].trim()]));
}

export function validateTokens(contract, common, theme) {
  const values = new Map([...common, ...theme]);
  const errors = [];
  const resolving = new Set();
  const cache = new Map();
  function expand(name) {
    if (cache.has(name)) return cache.get(name);
    if (!values.has(name)) throw new Error(`Undefined token: ${name}`);
    if (resolving.has(name)) throw new Error(`Circular token: ${name}`);
    resolving.add(name);
    const result = values.get(name).replace(/var\((--[\w-]+)\)/g, (_, reference) => expand(reference));
    resolving.delete(name);
    cache.set(name, result);
    return result;
  }
  const patterns = {
    color: /^(#[\da-f]{6}|rgba?\([\d\s.,/%]+\))$/i,
    length: /^\d*\.?\d+(rem|px)$/,
    duration: /^\d+(ms|s)$/,
    number: /^\d+(\.\d+)?$/,
    font: /\S/,
  };
  for (const [name, rule] of Object.entries(contract)) {
    if (!values.has(name) && !rule.required) continue;
    try {
      const value = expand(name);
      if (!patterns[rule.type]?.test(value)) errors.push(`Invalid ${rule.type}: ${name} = ${value}`);
    } catch (error) { errors.push(error.message); resolving.clear(); }
  }
  for (const name of values.keys()) {
    try { expand(name); } catch (error) { errors.push(error.message); resolving.clear(); }
  }
  return [...new Set(errors)];
}

export function checkRepository() {
  const root = new URL('../packages/ui/src/styles/', import.meta.url);
  const read = (file) => readFileSync(new URL(file, root), 'utf8');
  const contract = JSON.parse(read('tokens/contract.json'));
  const common = declarations(read('tokens/primitives.css') + read('tokens/semantic.css'));
  const errors = [];
  for (const theme of ['brewlog', 'cafelog']) {
    errors.push(...validateTokens(contract, common, declarations(read(`themes/${theme}.css`))).map((error) => `${theme}: ${error}`));
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return Object.keys(contract).length;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Validated ${checkRepository()} tokens in both themes.`);
}
