import React, { useState } from "react";
import { VerdictResult, ConflictData } from "./types";
import { PawIcon, CatJudgeAvatar, CatFaceIcon } from "../../common/components/Icons";

interface VerdictDisplayProps {
  result: VerdictResult;
  inputData: ConflictData;
  onReset: () => void;
}

export const VerdictDisplay: React.FC<VerdictDisplayProps> = ({
  result,
  inputData,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const isWinnerA = result.winner === "A";
  const isWinnerB = result.winner === "B";

  const handleCopy = () => {
    const textToCopy = `【猫猫法官裁决书】\n\n📜 案由：${
      inputData.cause
    }\n\n🏆 胜诉方：${result.winnerName}\n\n😺 判词：${
      result.funnyComment
    }\n\n💡 建议：\n${result.actionItems
      .map((item, i) => `${i + 1}. ${item}`)
      .join("\n")}\n\n快来找猫猫法官评理！`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 space-y-6 pb-20 animate-fade-in">
      {/* Verdict Header */}
      <div className="flex flex-col items-center mt-6">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <CatJudgeAvatar className="w-32 h-32 relative z-10" />
          {/* Badge based on result */}
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20 border-2 border-white transform rotate-3">
            {result.winner === "Draw" ? "平局喵" : `${result.winnerName} 胜诉`}
          </div>
        </div>

        <div className="text-center space-y-2 mt-6">
          <h1 className="text-2xl font-black text-gray-800 leading-tight px-4">
            {result.verdictTitle}
          </h1>
          <div className="bg-orange-50 text-orange-800 text-sm px-4 py-3 rounded-xl inline-block font-medium mx-4 italic relative border border-orange-100 shadow-sm mt-2">
            <span className="absolute -top-3 -left-2 text-3xl text-orange-200">
              ❝
            </span>
            {result.funnyComment}
            <span className="absolute -bottom-4 -right-1 text-3xl text-orange-200 leading-none">
              ❞
            </span>
          </div>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-bold flex items-center gap-1">
            <CatFaceIcon className="w-4 h-4" /> 铲屎官家庭地位指数
          </span>
        </div>

        <div className="space-y-5">
          {/* Player A Score */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span
                className={`font-bold ${
                  isWinnerA ? "text-orange-600" : "text-gray-600"
                }`}
              >
                {inputData.nameA}
              </span>
              <span className="font-mono font-bold text-gray-700">
                {result.scoreA}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isWinnerA
                    ? "bg-gradient-to-r from-orange-400 to-red-500"
                    : "bg-gray-300"
                }`}
                style={{ width: `${result.scoreA}%` }}
              />
            </div>
          </div>

          {/* Player B Score */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span
                className={`font-bold ${
                  isWinnerB ? "text-orange-600" : "text-gray-600"
                }`}
              >
                {inputData.nameB}
              </span>
              <span className="font-mono font-bold text-gray-700">
                {result.scoreB}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isWinnerB
                    ? "bg-gradient-to-r from-orange-400 to-red-500"
                    : "bg-gray-300"
                }`}
                style={{ width: `${result.scoreB}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-orange-50 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-20 h-20 bg-orange-100 rounded-full opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 text-orange-800 font-bold">
            <span className="text-xl">🧐</span>
            <h3>本喵分析</h3>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {result.analysis}
          </p>
        </div>
      </div>

      {/* Action Plan */}
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-sm p-5 border border-orange-100">
        <h3 className="font-bold text-orange-800 mb-4 flex items-center">
          <PawIcon className="w-5 h-5 mr-2" />
          裁决执行令
        </h3>
        <ul className="space-y-4">
          {result.actionItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start text-sm text-gray-700 group"
            >
              <span className="flex-shrink-0 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs mr-3 mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
                {idx + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 pt-2">
        <button
          onClick={handleCopy}
          className="w-full bg-orange-100 text-orange-700 font-bold py-3 rounded-xl hover:bg-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>已复制判决书！</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              <span>
                复制给 {isWinnerA ? inputData.nameB : inputData.nameA} 看
              </span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
        >
          退庭！下一个案子！
        </button>
      </div>
    </div>
  );
};
