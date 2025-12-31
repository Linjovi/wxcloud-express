import React, { useEffect, useState, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home } from "./common/components/Home";
import { HotSearch } from "./apps/hot-search/HotSearch";
import { AnswerBook } from "./apps/answer/index";
import TarotApp from "./apps/tarot/index";
import PhotographyApp from "./apps/photography/index";
import MemeApp from "./apps/meme/index";
import { JudgeApp } from "./apps/judge/JudgeApp";
import MeowBTIApp from "./apps/mbti/index";
import { SEO } from "./common/components/SEO";
import { CatPawNavigator } from "./common/components/CatPawNavigator";

// 路由深度映射，用于判断前进/后退
const routeDepth: Record<string, number> = {
  "/": 0,
  "/judge": 1,
  "/hot-search": 1,
  "/answer": 1,
  "/tarot": 1,
  "/photography": 1,
  "/meme": 1,
  "/mbti": 1,
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState(location);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevLocationRef = useRef<string>(location.pathname);
  const isInitialMount = useRef<boolean>(true);

  useEffect(() => {
    // 跳过初始加载的过渡
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentDepth = routeDepth[location.pathname] ?? 1;
    const prevDepth = routeDepth[prevLocationRef.current] ?? 1;

    // 判断导航方向
    const isBackward =
      currentDepth < prevDepth ||
      (location.pathname === "/" && prevLocationRef.current !== "/");

    setDirection(isBackward ? "backward" : "forward");

    if (location.pathname !== prevLocationRef.current) {
      setIsTransitioning(true);

      // 动画完成后更新显示的位置
      const timer = setTimeout(() => {
        setPrevLocation(location);
        setIsTransitioning(false);
      }, 350);

      prevLocationRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleBack = () => {
    if (location.pathname === "/") return;
    navigate("/");
  };

  const getSEODetails = (pathname: string) => {
    if (pathname.startsWith("/hot-search")) {
      return {
        title: "吃瓜喵 - 全网实时热搜聚合榜单",
        description:
          "吃瓜喵为您一站式聚合微博热搜、抖音热榜等全网平台的实时热点资讯。拒绝信息差，第一时间掌握娱乐八卦、社会新闻和网络流行梗，让您轻松高效吃瓜。",
        keywords:
          "微博热搜, 抖音热榜, 吃瓜, 实时热点, 娱乐新闻, 今日头条, 热点追踪, 社会新闻, 网络热梗, 聚合阅读",
      };
    }
    if (pathname.startsWith("/answer")) {
      return {
        title: "答案之书喵 - 治愈系心灵指引与决策助手",
        description:
          "心中有疑惑？不论是生活琐事还是人生抉择，来问问答案之书喵。通过神秘而治愈的仪式感，为您提供直击心灵的指引和建议，专治选择困难症。",
        keywords:
          "答案之书, 心理测试, 在线占卜, 趣味问答, 心灵指引, 决策助手, 选择困难症, 治愈系, 人生解答, 每日一签",
      };
    }
    if (pathname.startsWith("/tarot")) {
      return {
        title: "塔罗秘境喵 - 专业在线塔罗牌占卜与运势分析",
        description:
          "塔罗秘境喵提供沉浸式的在线塔罗牌占卜体验。涵盖爱情、事业、财运等多个维度，利用经典韦特塔罗牌阵，为您深度解析当下困境，指引未来方向。",
        keywords:
          "塔罗牌, 在线占卜, 运势分析, 塔罗测试, 星座运势, 爱情占卜, 事业运程, 韦特塔罗, 免费占卜, 神秘学",
      };
    }
    if (pathname.startsWith("/photography")) {
      return {
        title: "猫猫摄影师 - AI彩虹屁生成器与照片美化",
        description:
          "上传照片，让猫猫摄影师为您生成超可爱的AI彩虹屁文案！不仅是照片美化，更是心情美化。一键生成朋友圈高赞文案，治愈您的不开心，发现独一无二的自己。",
        keywords:
          "夸夸群, 彩虹屁, 猫猫摄影师, AI文案, 照片美化, 朋友圈文案, 治愈系, 自信神器, 夸夸生成器, 创意修图",
      };
    }
    if (pathname.startsWith("/judge")) {
      return {
        title: "法官喵 - AI趣味纠纷裁决与情感调解",
        description:
          "生活中有小摩擦？情侣吵架谁对谁错？让公正可爱、幽默风趣的猫猫法官为您断案。AI智能分析，用最温情的方式化解矛盾，是您的随身情感调解员。",
        keywords:
          "猫猫法官, 趣味裁决, 矛盾调解, 情感咨询, 吵架调解, AI断案, 幽默应用, 情侣吵架, 谁对谁错, 生活助手",
      };
    }
    if (pathname.startsWith("/meme")) {
      return {
        title: "表情包制作喵 - AI趣味表情包生成器",
        description:
          "上传图片，一键生成专属表情包！海量热门梗图模板，自定义文字特效，让你的聊天斗图战无不胜。猫猫工程师正在为您打造最有趣的表情包制作体验。",
        keywords:
          "表情包制作, 梗图生成器, AI表情包, 斗图神器, 图片编辑, 趣味文字, 热门表情包, 熊猫头, 蘑菇头, 聊天斗图",
      };
    }
    if (pathname.startsWith("/mbti")) {
      return {
        title: "喵BTI - 读懂喵心声，MBTI 聊天军师",
        description:
          "根据 MBTI 人格分析对方潜台词，提供高情商回复建议。你的专属情感聊天助手。",
        keywords:
          "MBTI, 聊天助手, 情感分析, 高情商回复, 恋爱话术",
      };
    }
    return {
      title: "呼噜呼噜事务所 - 您的治愈系AI趣味生活助手",
      description:
        "欢迎来到呼噜呼噜事务所！这里汇聚了猫猫摄影师、猫猫法官、吃瓜喵、塔罗秘境喵等一系列治愈有趣的AI应用。无论您是想看热搜、求夸奖、测运势还是断家务事，这里都能为您带来温暖与快乐。",
      keywords:
        "呼噜呼噜事务所, 猫猫摄影师, 猫猫法官, 塔罗牌, 热搜聚合, 趣味应用, AI应用, 治愈系, 生活助手, 休闲娱乐, Web3应用",
    };
  };

  const seoDetails = getSEODetails(location.pathname);

  // Wrappers to pass existing 'onBack' prop to components that might expect it,
  // although with Router they should ideally just link back or we handle it in NavBar.
  // Existing components:
  // HotSearch: props.onBack
  // AnswerBook: props.onBack
  // TarotApp: props.onBack
  // PhotographyApp: props.onBack

  return (
    // Mobile-first container constraint
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={seoDetails.title}
        description={seoDetails.description}
        keywords={seoDetails.keywords}
      />
      <div className="mx-auto min-h-screen bg-[#f9fafb] shadow-2xl relative overflow-hidden">
        {location.pathname !== "/" && <CatPawNavigator />}
        <main className="w-full page-transition-container">
          {/* 旧页面 - 退出动画 */}
          {isTransitioning && (
            <div
              className={`page-transition-wrapper page-exit ${direction}`}
              key={`prev-${prevLocation.pathname}`}
            >
              <Routes location={prevLocation}>
                <Route
                  path="/"
                  element={
                    <Home />
                  }
                />
                <Route path="/judge" element={<JudgeApp />} />
                <Route
                  path="/hot-search"
                  element={<HotSearch onBack={handleBack} />}
                />
                <Route
                  path="/answer"
                  element={<AnswerBook onBack={handleBack} />}
                />
                <Route
                  path="/tarot"
                  element={<TarotApp onBack={handleBack} />}
                />
                <Route
                  path="/photography"
                  element={<PhotographyApp onBack={handleBack} />}
                />
                <Route path="/meme" element={<MemeApp />} />
                <Route path="/mbti" element={<MeowBTIApp />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          )}

          {/* 新页面 - 进入动画 */}
          <div
            className={`page-transition-wrapper ${
              isTransitioning ? `page-enter ${direction}` : "page-idle"
            }`}
            key={`current-${location.pathname}`}
          >
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <Home />
                }
              />
              <Route path="/judge" element={<JudgeApp />} />
              <Route
                path="/hot-search"
                element={<HotSearch onBack={handleBack} />}
              />
              <Route
                path="/answer"
                element={<AnswerBook onBack={handleBack} />}
              />
              <Route path="/tarot" element={<TarotApp onBack={handleBack} />} />
              <Route
                path="/photography"
                element={<PhotographyApp onBack={handleBack} />}
              />
              <Route path="/meme" element={<MemeApp />} />
              <Route path="/mbti" element={<MeowBTIApp />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
