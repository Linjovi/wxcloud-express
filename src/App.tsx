import React, { useState } from "react";
import { NavBar } from "./common/components/NavBar";
import { JudgeForm } from "./apps/judge/JudgeForm";
import { VerdictDisplay } from "./apps/judge/VerdictDisplay";
import { LoadingScreen } from "./common/components/LoadingScreen";
import { Home } from "./common/components/Home";
import { HotSearch } from "./apps/hot-search/HotSearch";
import { AnswerBook } from "./apps/answer/index";
import TarotApp from "./apps/tarot/index";
import { AppState } from "./common/types";
import { ConflictData, VerdictResult } from "./apps/judge/types";
import { getCatJudgement } from "./apps/judge/api";

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
      appState === AppState.TAROT
    ) {
      setAppState(AppState.HOME);
    }
  };

  const getTitle = () => {
    if (appState === AppState.HOME) return "呼噜呼噜事务所";
    if (appState === AppState.WEIBO_HOT_SEARCH) return "吃瓜喵";
    if (appState === AppState.ANSWER_BOOK) return "答案之书喵";
    if (appState === AppState.TAROT) return "塔罗秘境喵";
    return "法官喵";
  };

  const getTheme = () => {
    if (appState === AppState.ANSWER_BOOK) return "dark";
    if (appState === AppState.TAROT) return "dark";
    return "light";
  };

  return (
    // Mobile-first container constraint
    <div className="min-h-screen bg-gray-50">
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
        </main>
      </div>
    </div>
  );
};

export default App;
