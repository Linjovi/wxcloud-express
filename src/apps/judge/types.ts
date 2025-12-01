export interface ConflictData {
  cause: string;
  sideA: string; // Usually the user
  sideB: string; // The partner
  nameA: string;
  nameB: string;
}

export interface AdviceItem {
  icon: string;
  text: string;
}

export interface VerdictResult {
  winner: "A" | "B" | "Draw";
  winnerName: string;
  verdictTitle: string;
  funnyComment: string;
  analysis: string;
  actionItems: string[];
  scoreA: number;
  scoreB: number;
}

