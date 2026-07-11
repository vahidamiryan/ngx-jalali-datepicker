/** Markdown files are bundled as raw text via the `loader` option in angular.json. */
declare module '*.md' {
  const content: string;
  export default content;
}
