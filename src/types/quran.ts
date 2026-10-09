export interface Surah {
  id: string;
  number: number;
  arabicName: string;
  transliteratedName: string;
  englishName: string;
  ayahCount: number;
}

export interface Ayah {
  surahId: string;
  number: number;
  arabicText: string;
  /** Individual words in reading order, used for word-level feedback and pitch-timeline alignment. */
  words: string[];
}
