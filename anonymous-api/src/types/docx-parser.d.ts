declare module 'docx-parser' {
  export function parseDocx(path: string, cb: (data: string) => void): void
}
