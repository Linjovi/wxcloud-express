export interface ComplimentResponse {
  compliment: string;
  tags: string[];
  score: number;
  catBreed: string;
  pickupLine: string;
  outfitEvaluation: string;
  outfitScore: number;
  outfitAdvice?: string;
  validSubject: boolean;
  errorHint: string;


}
