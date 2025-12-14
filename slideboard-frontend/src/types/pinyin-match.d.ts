declare module 'pinyin-match' {
    interface PinyinMatch {
        /**
         * Match Chinese text with pinyin
         * @param text - The Chinese text to search in
         * @param keyword - The pinyin keyword to search for
         * @returns Boolean if no match, or array of match positions if matched
         */
        match(text: string, keyword: string): boolean | [number, number][];
    }

    const pinyinMatch: PinyinMatch;
    export default pinyinMatch;
}
