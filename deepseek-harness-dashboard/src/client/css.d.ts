/** 允许 CSS ?raw 导入为字符串（tsdown 打包时把 CSS 当内联文本注入）。 */
declare module '*.css?raw' {
  const content: string
  export default content
}
