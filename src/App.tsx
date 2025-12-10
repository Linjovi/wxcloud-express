import React, { useState } from "react";
import { NavBar } from "./common/components/NavBar";
import { JudgeForm } from "./apps/judge/JudgeForm";
import { VerdictDisplay } from "./apps/judge/VerdictDisplay";
import { LoadingScreen } from "./common/components/LoadingScreen";
import { Home } from "./common/components/Home";
import { HotSearch } from "./apps/hot-search/HotSearch";
import { AnswerBook } from "./apps/answer/index";
import TarotApp from "./apps/tarot/index";
import ComplimentApp from "./apps/compliment/index";
import { AppState } from "./common/types";
import { ConflictData, VerdictResult } from "./apps/judge/types";
import { getCatJudgement } from "./apps/judge/api";
import { SEO } from "./common/components/SEO";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [result, setResult] = useState<VerdictResult | null>(null);

  const handleSubmit = async (data: ConflictData) => {
    setConflictData(data);
    setAppState(AppState.THINKING);

    try {
      const verdict = await getCatJudgement(data);
      setResult(verdict);
      setAppState(AppState.RESULT);
    } catch (error) {
      console.error("Error getting judgement:", error);
      alert("猫猫法官去睡觉了，请稍后再试喵！(API Error)");
      setAppState(AppState.INPUT);
    }
  };

  const handleReset = () => {
    setAppState(AppState.INPUT);
    setConflictData(null);
    setResult(null);
  };

  const handleBack = () => {
    if (appState === AppState.RESULT) {
      handleReset();
    } else if (
      appState === AppState.INPUT ||
      appState === AppState.WEIBO_HOT_SEARCH ||
      appState === AppState.ANSWER_BOOK ||
      appState === AppState.TAROT ||
      appState === AppState.COMPLIMENT
    ) {
      setAppState(AppState.HOME);
    }
  };

  const getTitle = () => {
    if (appState === AppState.HOME) return "呼噜呼噜事务所";
    if (appState === AppState.WEIBO_HOT_SEARCH) return "吃瓜喵";
    if (appState === AppState.ANSWER_BOOK) return "答案之书喵";
    if (appState === AppState.TAROT) return "塔罗秘境喵";
    if (appState === AppState.COMPLIMENT) return "夸夸喵";
    return "法官喵";
  };

  const getTheme = () => {
    if (appState === AppState.ANSWER_BOOK) return "dark";
    if (appState === AppState.TAROT) return "dark";
    return "light";
  };

  const getSEODetails = () => {
    switch (appState) {
      case AppState.WEIBO_HOT_SEARCH:
        return {
          title: "吃瓜喵 - 实时热搜聚合",
          description: "吃瓜喵为您聚合微博、抖音等平台的实时热搜，让您第一时间掌握网络热点，轻松吃瓜。",
          keywords: "微博热搜, 抖音热搜, 吃瓜, 实时热点, 娱乐新闻"
        };
      case AppState.ANSWER_BOOK:
        return {
          title: "答案之书喵 - 心灵指引",
          description: "心中的疑惑无法解答？来问问答案之书喵，为您提供神秘的心灵指引和人生解答。",
          keywords: "答案之书, 心理测试, 占卜, 趣味问答, 心灵指引"
        };
      case AppState.TAROT:
        return {
          title: "塔罗秘境喵 - 在线塔罗牌占卜",
          description: "塔罗秘境喵提供专业的在线塔罗牌占卜服务，通过神秘的塔罗牌阵为您解析运势、爱情与事业。",
          keywords: "塔罗牌, 在线占卜, 运势分析, 塔罗测试, 星座运势"
        };
      case AppState.COMPLIMENT:
        return {
          title: "夸夸喵 - 专业彩虹屁生成器",
          description: "上传照片，让夸夸喵为你生成超可爱的彩虹屁！治愈你的不开心，发现生活中的美。",
          keywords: "夸夸群, 彩虹屁, 猫咪, 治愈, 趣味生成器"
        };
      case AppState.INPUT:
      case AppState.THINKING:
      case AppState.RESULT:
        return {
          title: "法官喵 - 趣味纠纷裁决",
          description: "生活中有小摩擦？让公正可爱的猫猫法官为您断案，用幽默风趣的方式化解矛盾。",
          keywords: "猫猫法官, 趣味裁决, 矛盾调解, 幽默应用, 情感咨询"
        };
      default:
        return {
          title: "呼噜呼噜事务所 - 您的趣味生活助手",
          description: "呼噜呼噜事务所提供猫猫法官裁决、吃瓜热搜、塔罗占卜等趣味功能，为您提供温暖与乐趣。",
          keywords: "猫猫法官, 塔罗牌, 热搜, 趣味应用, 呼噜呼噜事务所"
        };
    }
  };

  const seoDetails = getSEODetails();

  return (
    // Mobile-first container constraint
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={seoDetails.title}
        description={seoDetails.description}
        keywords={seoDetails.keywords}
      />
      <div className="mx-auto min-h-screen bg-[#f9fafb] shadow-2xl relative">
        {appState !== AppState.HOME && (
          <NavBar
            onBack={handleBack}
            title={getTitle()}
            showBack={true}
            theme={getTheme()}
          />
        )}

        <main className="w-full">
          {appState === AppState.HOME && (
            <Home
              onSelectJudge={() => setAppState(AppState.INPUT)}
              onSelectGossip={() => setAppState(AppState.WEIBO_HOT_SEARCH)}
              onSelectTarot={() => setAppState(AppState.TAROT)}
              onSelectCompliment={() => setAppState(AppState.COMPLIMENT)}
            />
          )}

          {appState === AppState.INPUT && <JudgeForm onSubmit={handleSubmit} />}

          {appState === AppState.THINKING && <LoadingScreen />}

          {appState === AppState.RESULT && result && conflictData && (
            <VerdictDisplay
              result={result}
              inputData={conflictData}
              onReset={handleReset}
            />
          )}

          {appState === AppState.WEIBO_HOT_SEARCH && (
            <HotSearch onBack={handleBack} />
          )}

          {appState === AppState.ANSWER_BOOK && (
            <AnswerBook onBack={handleBack} />
          )}

          {appState === AppState.TAROT && (
            <TarotApp onBack={() => setAppState(AppState.HOME)} />
          )}

          {appState === AppState.COMPLIMENT && (
            <ComplimentApp onBack={handleBack} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
