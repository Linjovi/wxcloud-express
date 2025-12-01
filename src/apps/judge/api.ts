import { ConflictData, VerdictResult } from "./types";

interface ApiResponse {
  code: number;
  data: VerdictResult;
  message?: string;
}

export const getCatJudgement = async (
  data: ConflictData
): Promise<VerdictResult> => {
  try {
    const response = await fetch("/api/cat-judgement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nameA: data.nameA,
        nameB: data.nameB,
        cause: data.cause,
        sideA: data.sideA,
        sideB: data.sideB,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "猫猫法官去睡觉了，请稍后再试喵~");
    }

    const result: ApiResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "猫猫法官返回了错误");
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("网络错误，请稍后再试喵~");
  }
};

