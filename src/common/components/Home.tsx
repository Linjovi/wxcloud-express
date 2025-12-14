import React, { useState } from "react";

interface HomeProps {
  onSelectJudge: () => void;
  onSelectGossip: () => void;
  onSelectTarot: () => void;
  onSelectCompliment: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onSelectJudge,
  onSelectGossip,
  onSelectTarot,
  onSelectCompliment,
}) => {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const mapImageUrl = "https://pic1.imgdb.cn/item/693e46c5b297d4843ce57ea3.jpg"; // 如果图片在public目录，使用这个路径

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-yellow-50 via-green-50 to-blue-50 overflow-hidden">
      {/* 地图图片容器 */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "4/3", minHeight: "100vh" }}
      >
        <img
          src={mapImageUrl}
          alt="呼噜呼噜事务所地图"
          className="w-full h-full object-cover"
          onError={(e) => {
            // 如果图片加载失败，显示占位符
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const placeholder = document.getElementById("map-placeholder");
            if (placeholder) placeholder.style.display = "block";
          }}
        />

        {/* 可点击区域 - 猫剧院 (顶部) - 对应夸夸喵 */}
        <button
          onClick={onSelectCompliment}
          onMouseEnter={() => setHoveredArea("theatre")}
          onMouseLeave={() => setHoveredArea(null)}
          className="absolute top-[20%] left-[25%] w-[50%] h-[15%]"
          title="猫剧院 - 夸夸喵"
        >
          {hoveredArea === "theatre" && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
              夸夸喵 💛
            </div>
          )}
        </button>

        {/* 可点击区域 - 猫法庭 (中间) - 对应猫猫法官 */}
        <button
          onClick={onSelectJudge}
          onMouseEnter={() => setHoveredArea("courthouse")}
          onMouseLeave={() => setHoveredArea(null)}
          className="absolute top-[40%] left-[30%] w-[40%] h-[15%]"
          title="猫法庭 - 猫猫法官"
        >
          {hoveredArea === "courthouse" && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
              猫猫法官 ⚖️
            </div>
          )}
        </button>

        {/* 可点击区域 - 西瓜农场 (左下) - 对应吃瓜喵 */}
        <button
          onClick={onSelectGossip}
          onMouseEnter={() => setHoveredArea("farm")}
          onMouseLeave={() => setHoveredArea(null)}
          className="absolute top-[55%] left-[5%] w-[40%] h-[12%]"
          title="西瓜农场 - 吃瓜喵"
        >
          {hoveredArea === "farm" && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
              吃瓜喵 🍉
            </div>
          )}
        </button>

        {/* 可点击区域 - 占卜师帐篷 (右下) - 对应塔罗喵 */}
        <button
          onClick={onSelectTarot}
          onMouseEnter={() => setHoveredArea("tent")}
          onMouseLeave={() => setHoveredArea(null)}
          className="absolute top-[55%] right-[5%] w-[35%] h-[15%]"
          title="占卜师帐篷 - 塔罗喵"
        >
          {hoveredArea === "tent" && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
              塔罗喵 ✨
            </div>
          )}
        </button>
      </div>

      {/* 标题提示 */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
        <h1 className="text-lg font-black text-gray-800">呼噜呼噜事务所</h1>
      </div>
    </div>
  );
};
