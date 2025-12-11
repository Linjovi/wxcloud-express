import React from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Home } from "./common/components/Home";
import { HotSearch } from "./apps/hot-search/HotSearch";
import { AnswerBook } from "./apps/answer/index";
import TarotApp from "./apps/tarot/index";
import ComplimentApp from "./apps/compliment/index";
import { JudgeApp } from "./apps/judge/JudgeApp";
import { SEO } from "./common/components/SEO";

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname === "/") return;
    navigate("/");
  };

  const getSEODetails = (pathname: string) => {
    if (pathname.startsWith("/hot-search")) {
      return {
        title: "吃瓜喵 - 实时热搜聚合",
        description: "吃瓜喵为您聚合微博、抖音等平台的实时热搜，让您第一时间掌握网络热点，轻松吃瓜。",
        keywords: "微博热搜, 抖音热搜, 吃瓜, 实时热点, 娱乐新闻"
      };
    }
    if (pathname.startsWith("/answer")) {
      return {
        title: "答案之书喵 - 心灵指引",
        description: "心中的疑惑无法解答？来问问答案之书喵，为您提供神秘的心灵指引和人生解答。",
        keywords: "答案之书, 心理测试, 占卜, 趣味问答, 心灵指引"
      };
    }
    if (pathname.startsWith("/tarot")) {
      return {
        title: "塔罗秘境喵 - 在线塔罗牌占卜",
        description: "塔罗秘境喵提供专业的在线塔罗牌占卜服务，通过神秘的塔罗牌阵为您解析运势、爱情与事业。",
        keywords: "塔罗牌, 在线占卜, 运势分析, 塔罗测试, 星座运势"
      };
    }
    if (pathname.startsWith("/compliment")) {
      return {
        title: "夸夸喵 - 专业彩虹屁生成器",
        description: "上传照片，让夸夸喵为你生成超可爱的彩虹屁！治愈你的不开心，发现生活中的美。",
        keywords: "夸夸群, 彩虹屁, 猫咪, 治愈, 趣味生成器"
      };
    }
    if (pathname.startsWith("/judge")) {
      return {
        title: "法官喵 - 趣味纠纷裁决",
        description: "生活中有小摩擦？让公正可爱的猫猫法官为您断案，用幽默风趣的方式化解矛盾。",
        keywords: "猫猫法官, 趣味裁决, 矛盾调解, 幽默应用, 情感咨询"
      };
    }
    return {
      title: "呼噜呼噜事务所 - 您的趣味生活助手",
      description: "呼噜呼噜事务所提供猫猫法官裁决、吃瓜热搜、塔罗占卜等趣味功能，为您提供温暖与乐趣。",
      keywords: "猫猫法官, 塔罗牌, 热搜, 趣味应用, 呼噜呼噜事务所"
    };
  };

  const seoDetails = getSEODetails(location.pathname);

  // Wrappers to pass existing 'onBack' prop to components that might expect it, 
  // although with Router they should ideally just link back or we handle it in NavBar.
  // Existing components:
  // HotSearch: props.onBack
  // AnswerBook: props.onBack
  // TarotApp: props.onBack
  // ComplimentApp: props.onBack

  return (
    // Mobile-first container constraint
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={seoDetails.title}
        description={seoDetails.description}
        keywords={seoDetails.keywords}
      />
      <div className="mx-auto min-h-screen bg-[#f9fafb] shadow-2xl relative">
        <main className="w-full">
          <Routes>
            <Route path="/" element={
              <Home
                onSelectJudge={() => navigate("/judge")}
                onSelectGossip={() => navigate("/hot-search")}
                onSelectTarot={() => navigate("/tarot")}
                onSelectCompliment={() => navigate("/compliment")}
              />
            } />
            <Route path="/judge" element={<JudgeApp />} />
            <Route path="/hot-search" element={<HotSearch onBack={handleBack} />} />
            <Route path="/answer" element={<AnswerBook onBack={handleBack} />} />
            <Route path="/tarot" element={<TarotApp onBack={handleBack} />} />
            <Route path="/compliment" element={<ComplimentApp onBack={handleBack} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
