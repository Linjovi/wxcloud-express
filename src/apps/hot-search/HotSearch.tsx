import React, { useEffect, useState, useRef } from "react";
import {
  getWeiboHotSearch,
  getDouyinHotSearch,
  getXiaohongshuHotSearch,
  getMaoyanWebHeat,
} from "./api";
import { HotSearchItem, MaoyanWebHeatItem } from "./types";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

interface HotSearchProps {
  onBack: () => void;
}

type Source = "weibo" | "douyin" | "xiaohongshu" | "maoyan";

interface SourceData {
  list: (HotSearchItem | MaoyanWebHeatItem)[];
  summary?: string;
}


export const HotSearch: React.FC<HotSearchProps> = ({ onBack }) => {
  const [source, setSource] = useState<Source>("douyin");
  const [weiboData, setWeiboData] = useState<SourceData | null>(null);
  const [douyinData, setDouyinData] = useState<SourceData | null>(null);
  const [xhsData, setXhsData] = useState<SourceData | null>(null);
  const [maoyanData, setMaoyanData] = useState<SourceData | null>(null);


  const [loading, setLoading] = useState<Record<Source, boolean>>({
    weibo: false,
    douyin: false,
    xiaohongshu: false,
    maoyan: false,
  });
  const [error, setError] = useState<Record<Source, string | null>>({
    weibo: null,
    douyin: null,
    xiaohongshu: null,
    maoyan: null,
  });

  const swiperRef = useRef<SwiperType | null>(null);

  const getCurrentData = (targetSource: Source) => {
    switch (targetSource) {
      case "weibo":
        return weiboData;
      case "douyin":
        return douyinData;
      case "xiaohongshu":
        return xhsData;
      case "maoyan":
        return maoyanData;
      default:
        return null;
    }
  };

  const setCurrentData = (targetSource: Source, data: SourceData | null) => {
    switch (targetSource) {
      case "weibo":
        setWeiboData(data);
        break;
      case "douyin":
        setDouyinData(data);
        break;
      case "xiaohongshu":
        setXhsData(data);
        break;
      case "maoyan":
        setMaoyanData(data);
        break;
    }
  };

  const fetchSourceData = async (targetSource: Source) => {
    setLoading((prev) => ({ ...prev, [targetSource]: true }));
    setError((prev) => ({ ...prev, [targetSource]: null }));

    try {
      let result;
      if (targetSource === "weibo") {
        result = await getWeiboHotSearch();
      } else if (targetSource === "douyin") {
        result = await getDouyinHotSearch();
      } else if (targetSource === "xiaohongshu") {
        result = await getXiaohongshuHotSearch();
      } else {
        result = await getMaoyanWebHeat();
      }

      const dataToStore = {
        list: result.list,
        summary: result.summary,
      };

      setCurrentData(targetSource, dataToStore);

      // Cache data
      localStorage.setItem(
        `hotSearchData_${targetSource}`,
        JSON.stringify(dataToStore)
      );
      localStorage.setItem(
        `hotSearchTime_${targetSource}`,
        Date.now().toString()
      );
    } catch (err) {
      setError((prev) => ({
        ...prev,
        [targetSource]: "获取热搜失败，请稍后重试喵~",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [targetSource]: false }));
    }
  };


  const loadDataIfNeeded = (targetSource: Source) => {
    const currentMemoryData = getCurrentData(targetSource);
    if (currentMemoryData) {
      return;
    }

    const cachedData = localStorage.getItem(`hotSearchData_${targetSource}`);
    const cachedTime = localStorage.getItem(`hotSearchTime_${targetSource}`);

    if (cachedData && cachedTime) {
      const now = Date.now();
      if (now - parseInt(cachedTime) < 1800000) {
        try {
          const parsedData = JSON.parse(cachedData);
          setCurrentData(targetSource, parsedData);
          return;
        } catch (e) {
          console.error("Failed to parse cached data", e);
        }
      }
    }

    fetchSourceData(targetSource);
  };

  useEffect(() => {
    // Prefetch all sources on mount if needed
    loadDataIfNeeded("douyin");
    loadDataIfNeeded("xiaohongshu");
    loadDataIfNeeded("weibo");
    loadDataIfNeeded("maoyan");
  }, []);


  const handleTabChange = (newSource: Source) => {
    setSource(newSource);
    if (swiperRef.current) {
      const index =
        newSource === "douyin" ? 0 : newSource === "xiaohongshu" ? 1 : newSource === "weibo" ? 2 : 3;
      swiperRef.current.slideTo(index);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshData = () => {
    localStorage.removeItem(`hotSearchData_${source}`);
    localStorage.removeItem(`hotSearchTime_${source}`);
    fetchSourceData(source);
  };

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
        return "text-red-600";
      case "pinned":
        return "text-blue-600";
      case "fei":
        return "text-indigo-500";
      case "recommend":
        return "text-cyan-600";
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


  const renderList = (targetSource: Source) => {
    const data = getCurrentData(targetSource);
    const isLoading = loading[targetSource];
    const isError = error[targetSource];

    if (isLoading && !data) {
      return (
        <div className="flex flex-col items-center justify-center py-12 animate-pulse">
          <div
            className={`w-10 h-10 border-3 rounded-full animate-spin mb-3 ${targetSource === "weibo"
              ? "border-pink-200 border-t-pink-500"
              : targetSource === "douyin"
                ? "border-gray-200 border-t-black"
                : targetSource === "xiaohongshu"
                  ? "border-red-200 border-t-red-500"
                  : "border-cyan-200 border-t-cyan-500"
              }`}
          ></div>
          <p className="text-gray-400 text-xs font-medium">正在搬运大瓜...</p>
        </div>
      );
    }

    if (isError && !data) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4 text-sm">{isError}</p>
          <button
            onClick={() => fetchSourceData(targetSource)}
            className={`px-6 py-2 rounded-full font-bold shadow-sm active:scale-95 transition-all text-white text-sm ${targetSource === "weibo"
              ? "bg-pink-500"
              : targetSource === "douyin"
                ? "bg-black"
                : targetSource === "xiaohongshu"
                  ? "bg-red-500"
                  : "bg-cyan-600"
              }`}
          >
            重试一下
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2 animate-slide-up p-4 pt-0 pb-20">
        {data?.list.map((item, index) => {
          // Handle Maoyan specific fields safely
          const isMaoyan = targetSource === "maoyan";
          const maoyanItem = isMaoyan ? (item as MaoyanWebHeatItem) : null;
          const hotValue = isMaoyan ? maoyanItem?.heat : (item as HotSearchItem).hot;
          const link = item.link || "#";

          return (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white px-4 py-3 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-[0.99] transition-all relative overflow-hidden group hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs font-black shrink-0 ${getRankColor(
                    item.rank
                  )}`}
                >
                  {item.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800 truncate text-[15px] group-hover:text-pink-600 transition-colors">
                      {item.title}
                    </h3>
                    {item.iconType && (
                      <span
                        className={`text-[10px] font-bold shrink-0 px-1 py-0.5 rounded border border-current leading-none ${getIconColor(
                          item.iconType
                        )}`}
                      >
                        {item.iconType === "hot"
                          ? "热"
                          : item.iconType === "new"
                            ? "新"
                            : item.iconType === "boil"
                              ? "沸"
                              : item.iconType === "fei"
                                ? "飞"
                                : item.iconType === "recommend"
                                  ? "荐"
                                  : item.iconType === "pinned"
                                    ? "置顶"
                                    : item.iconType === "first"
                                      ? "首发"
                                      : item.iconType === "exclusive"
                                        ? "独家"
                                        : item.iconType === "rumor"
                                          ? "辟谣"
                                          : item.iconType}
                      </span>
                    )}
                  </div>
                  {isMaoyan && maoyanItem && (
                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                      <span className="bg-gray-50 px-1.5 rounded text-gray-500">{maoyanItem.platform}</span>
                      <span>{maoyanItem.releaseInfo}</span>
                    </div>
                  )}
                </div>

                {hotValue && hotValue !== "0" && (
                  <div className="text-xs text-gray-400 font-mono shrink-0 tabular-nums opacity-80">
                    {hotValue}
                  </div>
                )}
              </div>
            </a>
          );
        })}

        {!isLoading && !isError && (
          <div className="mt-6 text-center">
            <button
              onClick={() => refreshData()}
              className={`text-sm transition-colors flex items-center justify-center gap-1 mx-auto ${targetSource === "weibo"
                ? "text-gray-400 hover:text-pink-500"
                : targetSource === "douyin"
                  ? "text-gray-400 hover:text-black"
                  : targetSource === "xiaohongshu"
                    ? "text-gray-400 hover:text-red-500"
                    : "text-gray-400 hover:text-cyan-600"
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
    );
  };

  return (
    <div className="h-screen bg-white flex flex-col relative">
      <div className="absolute top-0 left-0 w-full h-[280px] bg-gradient-to-b from-orange-100 via-pink-50 to-transparent pointer-events-none z-0" />
      <div className="top-0 z-20 bg-white/0 backdrop-blur-sm flex-shrink-0 pt-4">
        <div className="flex items-center gap-3 px-6 mb-2">
          <h1 className="text-2xl font-black text-pink-600 tracking-wider">
            吃瓜喵
          </h1>
          <p className="text-xs text-pink-500 font-bold opacity-80">
            全网热瓜 · 一网打尽
          </p>
        </div>

        <div className="px-4 pb-2 mt-4">
          <div className="flex p-1 bg-gray-100/80 rounded-xl backdrop-blur-sm shadow-inner">
            <button
              onClick={() => handleTabChange("douyin")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${source === "douyin"
                ? "bg-white text-black shadow-sm scale-[1.02]"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base">🎵</span> 抖音
              </div>
            </button>
            <button
              onClick={() => handleTabChange("xiaohongshu")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${source === "xiaohongshu"
                ? "bg-white text-red-500 shadow-sm scale-[1.02]"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base">📕</span> 小红书
              </div>
            </button>
            <button
              onClick={() => handleTabChange("weibo")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${source === "weibo"
                ? "bg-white text-pink-600 shadow-sm scale-[1.02]"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base">🔴</span> 微博
              </div>
            </button>
            <button
              onClick={() => handleTabChange("maoyan")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${source === "maoyan"
                ? "bg-white text-cyan-600 shadow-sm scale-[1.02]"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base">🎬</span> 网剧
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            const index = swiper.activeIndex;
            const newSource =
              index === 0
                ? "douyin"
                : index === 1
                  ? "xiaohongshu"
                  : index === 2
                    ? "weibo"
                    : "maoyan";
            setSource(newSource);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="h-full"
        >
          <SwiperSlide className="h-full overflow-y-auto no-scrollbar">
            {renderList("douyin")}
          </SwiperSlide>
          <SwiperSlide className="h-full overflow-y-auto no-scrollbar">
            {renderList("xiaohongshu")}
          </SwiperSlide>
          <SwiperSlide className="h-full overflow-y-auto no-scrollbar">
            {renderList("weibo")}
          </SwiperSlide>
          <SwiperSlide className="h-full overflow-y-auto no-scrollbar">
            {renderList("maoyan")}
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
};
