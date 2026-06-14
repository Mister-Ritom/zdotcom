// Ambient type declarations for CSS modules and CSS side-effect imports
// (used by the Expo starter kit components)

declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}

declare module '*.module.css' {
  const styles: Record<string, string>;
  export default styles;
}
