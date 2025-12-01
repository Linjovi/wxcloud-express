import React, { useEffect, useState } from "react";
import { GossipCatAvatar } from "../../common/components/Icons";
import { getAllHotSearch } from "./api";
import { HotSearchItem } from "./types";

interface HotSearchProps {
  onBack: () => void;
}

type Source = "weibo" | "douyin";

export const HotSearch: React.FC<HotSearchProps> = ({ onBack }) => {
  const [source, setSource] = useState<Source>("weibo");
  const [data, setData] = useState<{
    weibo: HotSearchItem[];
    douyin: HotSearchItem[];
    summary?: string;
  }>({ weibo: [], douyin: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllHotSearch();
      setData(result);
    } catch (err) {
      setError("获取热搜失败，请稍后重试喵~");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [source]);

  const list = source === "weibo" ? data.weibo : data.douyin;

  const getRankColor = (rank: number | string | null) => {
    if (rank === "置顶") return "bg-red-500 text-white";
    if (typeof rank === "number") {
      if (rank === 1) return "bg-red-500 text-white";
      if (rank === 2) return "bg-orange-500 text-white";
      if (rank === 3) return "bg-yellow-500 text-white";
    }
    return "bg-gray-100 text-gray-500";
  };

  const getIconColor = (type: string | null) => {
    switch (type) {
      case "hot":
        return "text-orange-500";
      case "new":
        return "text-green-500";
      case "boil":
      case "first":
        return "text-red-600";
      case "rumor":
        return "text-blue-500";
      case "exclusive":
        return "text-purple-500";
      default:
        return "text-gray-400";
    }
  };

  const getThemeColor = () =>
    source === "weibo" ? "text-pink-500 bg-pink-50" : "text-black bg-gray-50";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white pb-20">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="p-4 pb-2 flex items-center gap-4">
          <GossipCatAvatar className="w-12 h-12 shrink-0" />
          <div>
            <h2 className="text-lg font-black text-gray-800">吃瓜喵</h2>
            <p className="text-xs text-gray-500">全网热瓜，一网打尽！</p>
          </div>
        </div>

        <div className="flex px-4 pb-2 gap-4">
          <button
            onClick={() => setSource("weibo")}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
              source === "weibo"
                ? "bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-200"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-lg">🔴</span> 微博热搜
            </div>
          </button>
          <button
            onClick={() => setSource("douyin")}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
              source === "douyin"
                ? "bg-black text-white shadow-lg shadow-gray-200"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-lg">🎵</span> 抖音热榜
            </div>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 animate-pulse">
            <div
              className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${
                source === "weibo"
                  ? "border-pink-200 border-t-pink-500"
                  : "border-gray-200 border-t-black"
              }`}
            ></div>
            <p className="text-gray-400 text-sm">正在搬运大瓜...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className={`px-6 py-2 rounded-full font-bold shadow-lg active:scale-95 transition-all text-white ${
                source === "weibo"
                  ? "bg-pink-500 shadow-pink-200"
                  : "bg-black shadow-gray-200"
              }`}
            >
              重试一下
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {/* AI Summary Card */}
            {data.summary && (
              <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-4 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-bl-full opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🤖</span>
                    <h3 className="font-bold text-purple-900">吃瓜喵的总结</h3>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white/60 p-3 rounded-xl border border-purple-50/50">
                    {data.summary}
                  </div>
                </div>
              </div>
            )}

            {list.map((item, index) => (
              <a
                key={index}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform relative overflow-hidden group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 ${getRankColor(
                      item.rank
                    )}`}
                  >
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-pink-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.iconType && (
                        <span
                          className={`text-xs font-bold shrink-0 px-1 rounded border border-current ${getIconColor(
                            item.iconType
                          )}`}
                        >
                          {item.iconType === "hot"
                            ? "热"
                            : item.iconType === "new"
                            ? "新"
                            : item.iconType === "boil"
                            ? "沸"
                            : item.iconType === "first"
                            ? "首发"
                            : item.iconType === "exclusive"
                            ? "独家"
                            : item.iconType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {item.hot ? `热度 ${item.hot}` : "置顶推荐"}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 text-center">
            <button
              onClick={fetchData}
              className={`text-sm transition-colors flex items-center justify-center gap-1 mx-auto ${
                source === "weibo"
                  ? "text-gray-400 hover:text-pink-500"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              刷新列表
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
