declare module 'emoji-toolkit' {
  export function shortnameToUnicode(str: string): string;
  export function toShort(str: string): string;
  export function unicodeToShortname(str: string): string;
  export function toImage(str: string): string;
} 