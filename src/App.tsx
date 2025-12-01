import React, { useState } from "react";
import { NavBar } from "./common/components/NavBar";
import { JudgeForm } from "./apps/judge/JudgeForm";
import { VerdictDisplay } from "./apps/judge/VerdictDisplay";
import { LoadingScreen } from "./common/components/LoadingScreen";
import { Home } from "./common/components/Home";
import { HotSearch } from "./apps/hot-search/HotSearch";
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
    } else if (appState === AppState.INPUT || appState === AppState.WEIBO_HOT_SEARCH) {
      setAppState(AppState.HOME);
    }
  };

  const getTitle = () => {
    if (appState === AppState.HOME) return "AI 喵星球";
    if (appState === AppState.WEIBO_HOT_SEARCH) return "吃瓜喵";
    return "猫猫法官";
  };

  return (
    // Mobile-first container constraint
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto min-h-screen bg-[#f9fafb] shadow-2xl relative">
        <NavBar
          onBack={handleBack}
          title={getTitle()}
          showBack={appState !== AppState.HOME}
        />

        <main className="w-full">
          {appState === AppState.HOME && (
            <Home
              onSelectJudge={() => setAppState(AppState.INPUT)}
              onSelectGossip={() => setAppState(AppState.WEIBO_HOT_SEARCH)}
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
        </main>
      </div>
    </div>
  );
};

export default App;
