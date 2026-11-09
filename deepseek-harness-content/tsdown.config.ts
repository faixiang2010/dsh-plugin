import { defineConfig } from 'tsdown'

export default defineConfig([
  // Host / Node half — 本插件所有功能都在浏览器端，这里只保留空实现。
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
  // Client / Browser half — DSH 通过动态 module loader 加载。
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    deps: {
      neverBundle: ['react', 'react/jsx-runtime', 'react-dom'],
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "deepseek-harness-content", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
