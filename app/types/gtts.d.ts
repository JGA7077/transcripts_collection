declare module 'gtts' {
  class GTTS {
    constructor(text: string, lang?: string);
    save(path: string, callback: (err: string) => void): void;
  }

  export = GTTS;
}
