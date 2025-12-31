import React, { useState } from "react";
import {
  FortuneCatAvatar,
  SparklesIcon,
  BookIcon,
} from "../../common/components/Icons";
import answers from "../../common/const/answer";
import { AnswerItem } from "./types";

enum AppState {
  ANSWER_BOOK_SETUP,
  ANSWER_BOOK_THINKING,
  ANSWER_BOOK_RESULT,
}

export const getRandomAnswer = (): AnswerItem => {
  // Basic random selection
  const randomIndex = Math.floor(Math.random() * answers.length);
  return answers[randomIndex];
};

interface AnswerBookProps {
  onBack: () => void;
}

export const AnswerBook: React.FC<AnswerBookProps> = () => {
  const [answer, setAnswer] = useState<AnswerItem | null>(null);
  const [appState, setAppState] = useState(AppState.ANSWER_BOOK_SETUP);

  const handleAsk = () => {
    setAppState(AppState.ANSWER_BOOK_THINKING);
    setTimeout(() => {
      const result = getRandomAnswer();
      setAnswer(result);
      setAppState(AppState.ANSWER_BOOK_RESULT);
    }, 2500); // 2.5 seconds delay for "mystic effect"
  };

  const handleReset = () => {
    setAnswer(null);
    setAppState(AppState.ANSWER_BOOK_SETUP);
  };

  // Background effect component
  const MysticBackground = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900"></div>
      {/* Stars / Particles */}
      <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
      <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse animation-delay-200"></div>
      <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-indigo-300 rounded-full animate-pulse animation-delay-500 blur-[1px]"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-700"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse animation-delay-200"></div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <MysticBackground />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 pt-20 text-center">
        {appState === AppState.ANSWER_BOOK_SETUP && (
          <div className="space-y-10 animate-fade-in w-full max-w-md">
            <div className="space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
                <FortuneCatAvatar className="w-32 h-32 relative z-10 border-4 border-purple-300/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-200 tracking-wider drop-shadow-lg">
                答案之书喵
              </h1>
              <p className="text-purple-200/80 text-sm font-medium tracking-wide leading-relaxed">
                "心中默念你的问题... <br />
                宇宙自有安排... 喵~"
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleAsk}
                className="group relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full opacity-80 blur-md group-hover:blur-xl group-hover:opacity-100 animate-pulse transition-all duration-500"></div>
                <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="relative z-10 bg-indigo-950/90 backdrop-blur-sm w-32 h-32 rounded-full flex flex-col items-center justify-center border border-purple-400/50 shadow-2xl">
                  <BookIcon className="w-10 h-10 text-purple-100 mb-1" />
                  <span className="text-purple-100 font-bold tracking-widest text-sm">
                    点击揭晓
                  </span>
                </div>
              </button>
            </div>

            <p className="text-xs text-purple-300/60 animate-pulse">
              (请把手放在按钮上感受能量)
            </p>
          </div>
        )}

        {appState === AppState.ANSWER_BOOK_THINKING && (
          <div className="space-y-8 w-full max-w-md flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl animate-pulse opacity-50"></div>
              <BookIcon className="w-24 h-24 text-white relative z-10 animate-bounce" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-2xl font-black text-white tracking-widest animate-pulse">
                翻阅命运中...
              </h3>
              <p className="text-xs text-purple-300">喵喵正在连接宇宙信号...</p>
            </div>
          </div>
        )}

        {appState === AppState.ANSWER_BOOK_RESULT && answer && (
          <div className="space-y-8 w-full max-w-md animate-fade-in-up">
            <div className="mb-8">
              <div className="text-xs text-purple-300 tracking-[0.3em] uppercase mb-4 opacity-80">
                The Answer Is
              </div>
              <div className="relative py-8">
                <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full transform scale-150"></div>
                <h1 className="relative text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 leading-tight drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] font-serif">
                  {answer.answer}
                </h1>
                <SparklesIcon className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-spin-slow opacity-80" />
                <SparklesIcon className="absolute bottom-0 -left-2 w-6 h-6 text-purple-300 animate-pulse opacity-60" />
              </div>
              <p className="text-lg text-indigo-200 mt-6 font-serif italic opacity-80 border-t border-white/10 pt-4 inline-block px-8">
                "{answer.answer_en}"
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 max-w-xs mx-auto transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-4">
                <FortuneCatAvatar className="w-14 h-14 border-2 border-purple-300/30 shadow-lg" />
                <div className="text-left">
                  <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                    Mystic Cat Says
                  </div>
                  <div className="text-xs text-purple-100 mt-1 leading-relaxed">
                    "不要怀疑，这就是宇宙给你的启示喵！"
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="mt-8 px-10 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
            >
              再问一个问题
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
