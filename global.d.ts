// Global type declarations for the project

declare module 'react-datepicker/dist/react-datepicker.css';

// You can add other global module declarations here as needed
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}