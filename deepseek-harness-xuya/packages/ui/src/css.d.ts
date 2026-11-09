/** Inline styles are installed and removed by their owning plugin. */
declare module '*.css?inline' { const css: string; export default css }
