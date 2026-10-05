import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = fileURLToPath(new URL('../', import.meta.url));

// Load real TypeScript helpers with explicit mocks for native/platform boundaries.
export function loadTs(entry, mocks = {}) {
  const cache = new Map();
  function load(path) {
    const file = [path, path + '.ts', path + '.tsx', resolve(path, 'index.ts')].find(
      (candidate) => existsSync(candidate) && /\.tsx?$/.test(candidate),
    );
    if (!file) throw new Error('Missing test module: ' + path);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const output = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/')) return load(resolve(root, name.slice(2)));
      if (name.startsWith('.')) return load(resolve(dirname(file), name));
      return require(name);
    };
    vm.runInThisContext('(function(exports, require, module) {' + output + '\n})', { filename: file })(
      module.exports,
      localRequire,
      module,
    );
    return module.exports;
  }
  return load(resolve(root, entry));
}
