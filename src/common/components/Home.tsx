import React from "react";
import { CatJudgeAvatar, GossipCatAvatar } from "./Icons";

interface HomeProps {
  onSelectJudge: () => void;
  onSelectGossip: () => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectJudge, onSelectGossip }) => {
  return (
    <div className="p-4 space-y-6 pt-8 pb-20 animate-fade-in">
      <div className="px-2">
        <h1 className="text-2xl font-black text-gray-800">欢迎来到</h1>
        <h2 className="text-xl font-bold text-orange-500">AI 喵星球 🪐</h2>
      </div>

      <div className="space-y-4">
        {/* Cat Judge App */}
        <button
          onClick={onSelectJudge}
          className="w-full bg-white p-4 rounded-3xl shadow-lg shadow-gray-100 border border-white flex items-center gap-4 active:scale-95 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full opacity-50"></div>

          <div className="relative">
            <div className="absolute inset-0 bg-orange-100 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <CatJudgeAvatar className="w-16 h-16 relative z-10" />
          </div>

          <div className="flex-1 text-left z-10">
            <h3 className="font-bold text-gray-800 text-lg">猫猫法官</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              情侣吵架？让本喵法官来评评理！
            </p>
            <div className="mt-2 flex gap-2">
              <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100">
                热门 🔥
              </span>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                情感调解
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-orange-50 group-hover:text-orange-400 transition-colors z-10">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        {/* Gossip Cat App */}
        <button
          onClick={onSelectGossip}
          className="w-full bg-white p-4 rounded-3xl shadow-lg shadow-gray-100 border border-white flex items-center gap-4 active:scale-95 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-100 to-transparent rounded-bl-full opacity-50"></div>

          <div className="relative">
            <div className="absolute inset-0 bg-pink-100 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <GossipCatAvatar className="w-16 h-16 relative z-10" />
          </div>

          <div className="flex-1 text-left z-10">
            <h3 className="font-bold text-gray-800 text-lg">吃瓜喵</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              全网热瓜，一网打尽！
            </p>
            <div className="mt-2 flex gap-2">
              <span className="bg-pink-50 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-100">
                实时热搜 🍉
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-pink-50 group-hover:text-pink-400 transition-colors z-10">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        {/* Placeholder for 'More' */}
        <div className="w-full bg-gray-100/50 p-4 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400">
          <span className="text-lg">🏗️</span>
          <span className="text-sm font-bold">更多 AI 应用建设中...</span>
        </div>
      </div>
    </div>
  );
};
