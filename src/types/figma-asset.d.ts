// Ambient declaration for Figma asset imports (figma:asset/...)
// These are resolved by Vite/Figma at build time to asset URLs.
declare module 'figma:asset/*' {
  const src: string;
  export default src;
}
