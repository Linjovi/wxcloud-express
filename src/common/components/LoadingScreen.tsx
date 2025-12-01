import React, { useState, useEffect } from "react";
import { CatJudgeAvatar } from "./Icons";

export const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "法官正在舔毛思考...",
    "正在分析谁的小鱼干给少了...",
    "咨询陪审团 (隔壁大黄狗) 中...",
    "正在查阅《猫咪法典》第 83 条...",
    "试图理解人类复杂的愚蠢...",
    "严肃判断谁该去铲屎...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 p-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-100 rounded-full blur-xl animate-pulse"></div>
        <CatJudgeAvatar className="w-32 h-32 relative z-10 animate-bounce" />
      </div>

      <div className="space-y-3 h-16">
        <h3 className="text-xl font-bold text-gray-800 transition-all duration-300">
          {messages[messageIndex]}
        </h3>
        <p className="text-gray-500 text-xs">AI 法官正在生成裁决书</p>
      </div>

      <div className="flex space-x-2 pt-2">
        <div className="w-3 h-3 bg-orange-300 rounded-full animate-bounce"></div>
        <div
          className="w-3 h-3 bg-orange-400 rounded-full animate-bounce animation-delay-200"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="w-3 h-3 bg-orange-500 rounded-full animate-bounce animation-delay-400"
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
    </div>
  );
};
