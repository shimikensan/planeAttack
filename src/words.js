import wordsData from '../words.json';

// We shuffle and pick random words for the game
export class WordManager {
  constructor() {
    this.words = wordsData;
    this.wrongWords = new Set();
  }

  getRandomWords(count = 3) {
    const shuffled = [...this.words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  generateQuestion() {
    // Generate 3 random words
    const options = this.getRandomWords(3);
    // Pick 1 as the correct answer
    const correctIndex = Math.floor(Math.random() * options.length);
    const correctWord = options[correctIndex];

    return {
      vietnamese: correctWord.vi,
      correctEnglish: correctWord.en,
      options: options.map(w => w.en)
    };
  }

  addWrongWord(english, vietnamese) {
    this.wrongWords.add(`${english} - ${vietnamese}`);
  }

  getWrongWords() {
    return Array.from(this.wrongWords);
  }

  reset() {
    this.wrongWords.clear();
  }
}

export const wordManager = new WordManager();
