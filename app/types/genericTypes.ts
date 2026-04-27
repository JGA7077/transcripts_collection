export interface ParaphraseEvaluation {
  isCorrect: boolean;
  feedback: string;
}

export interface GenerateAudios {
  lang: string;
  text: string;
}