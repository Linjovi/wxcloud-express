import React, { useState } from "react";
import { JudgeForm } from "./JudgeForm";
import { VerdictDisplay } from "./VerdictDisplay";
import { LoadingScreen } from "../../common/components/LoadingScreen";
import { ConflictData, VerdictResult } from "./types";
import { getCatJudgement } from "./api";

enum JudgeState {
    INPUT = "INPUT",
    THINKING = "THINKING",
    RESULT = "RESULT",
}

export const JudgeApp: React.FC = () => {
    const [state, setState] = useState<JudgeState>(JudgeState.INPUT);
    const [conflictData, setConflictData] = useState<ConflictData | null>(null);
    const [result, setResult] = useState<VerdictResult | null>(null);

    const handleSubmit = async (data: ConflictData) => {
        setConflictData(data);
        setState(JudgeState.THINKING);

        try {
            const verdict = await getCatJudgement(data);
            setResult(verdict);
            setState(JudgeState.RESULT);
        } catch (error) {
            console.error("Error getting judgement:", error);
            alert("猫猫法官去睡觉了，请稍后再试喵！(API Error)");
            setState(JudgeState.INPUT);
        }
    };

    const handleReset = () => {
        setState(JudgeState.INPUT);
        setConflictData(null);
        setResult(null);
    };

    return (
        <>
            {state === JudgeState.INPUT && <JudgeForm onSubmit={handleSubmit} />}
            {state === JudgeState.THINKING && <LoadingScreen />}
            {state === JudgeState.RESULT && result && conflictData && (
                <VerdictDisplay
                    result={result}
                    inputData={conflictData}
                    onReset={handleReset}
                />
            )}
        </>
    );
}
