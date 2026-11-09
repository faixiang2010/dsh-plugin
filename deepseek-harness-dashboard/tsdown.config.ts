import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'tsdown'

// `?raw` imports a file as its text (mirrors dsh-superagent). tsdown refuses
// `.css` ids without @tsdown/css, so we load them as raw strings and inject
// through <style> tags at runtime.
const raw = {
  name: 'raw',
  resolveId: (source: string, importer?: string) => source.endsWith('?raw') && importer ? resolve(dirname(importer), source) : undefined,
  load: (id: string) => id.endsWith('?raw') ? { code: `export default ${JSON.stringify(readFileSync(id.slice(0, -4), 'utf8'))}`, moduleType: 'js' as const }
    : undefined,
}

export default defineConfig([
  // Host / Node half
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    fixedExtension: false,
    platform: 'node',
    target: 'es2024',
    dts: true,
    clean: true,
    deps: {
      neverBundle: [/^@deepseek-ai\//],
    },
  },
  // Client / Browser half — DSH 通过动态 module loader 加载
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    plugins: [raw],
    deps: {
      neverBundle: ['react', 'react/jsx-runtime', 'react-dom'],
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "dsh-dashboard-wuhan", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
