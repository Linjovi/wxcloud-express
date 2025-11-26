import React, { useState } from "react";
import { NavBar } from "./components/NavBar";
import { JudgeForm } from "./components/JudgeForm";
import { VerdictDisplay } from "./components/VerdictDisplay";
import { LoadingScreen } from "./components/LoadingScreen";
import { Home } from "./components/Home";
import { AppState, ConflictData, VerdictResult } from "./types";
// import { getCatJudgement } from "./services/geminiService";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [result, setResult] = useState<VerdictResult | null>(null);

  const handleSubmit = async (data: ConflictData) => {
    setConflictData(data);
    setAppState(AppState.THINKING);

    // try {
    //   const verdict = await getCatJudgement(data);
    //   setResult(verdict);
    //   setAppState(AppState.RESULT);
    // } catch (error) {
    //   console.error("Error getting judgement:", error);
    //   alert("猫猫法官去睡觉了，请稍后再试喵！(API Error)");
    //   setAppState(AppState.INPUT);
    // }
  };

  const handleReset = () => {
    setAppState(AppState.INPUT);
    setConflictData(null);
    setResult(null);
  };

  const handleBack = () => {
    if (appState === AppState.RESULT) {
      handleReset();
    } else if (appState === AppState.INPUT) {
      setAppState(AppState.HOME);
    }
  };

  const getTitle = () => {
    if (appState === AppState.HOME) return "AI 喵星球";
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
            <Home onSelect={() => setAppState(AppState.INPUT)} />
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
        </main>
      </div>
    </div>
  );
};

export default App;
