// Allow CSS file imports (used in main.tsx for globals.css)
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
