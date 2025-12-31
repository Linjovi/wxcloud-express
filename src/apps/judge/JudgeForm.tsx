import React, { useState, useRef, useEffect } from "react";
import { ConflictData } from "./types";
import { CatJudgeAvatar } from "../../common/components/Icons";

// Add global declaration for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface JudgeFormProps {
  onSubmit: (data: ConflictData) => void;
}

export const JudgeForm: React.FC<JudgeFormProps> = ({ onSubmit }) => {
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [formData, setFormData] = useState<ConflictData>({
    cause: "",
    sideA: "",
    sideB: "",
    nameA: "",
    nameB: "",
  });

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "zh-CN";
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("您的浏览器不支持语音输入，请使用打字输入喵~");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      const recognition = recognitionRef.current;
      
      recognition.onresult = (event: any) => {
        let newContent = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newContent += event.results[i][0].transcript;
          }
        }
        if (newContent) {
          setFormData(prev => ({ ...prev, cause: prev.cause + newContent }));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      try {
        recognition.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Start recording failed", e);
        setIsRecording(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only cause is strictly required. Names default if empty.
    if (!formData.cause) return;

    onSubmit({
      ...formData,
      nameA: formData.nameA || "小笨蛋A",
      nameB: formData.nameB || "大傻瓜B",
    });
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header Card */}
      <div style={{ height: "3rem" }}></div>
      <div className="bg-white rounded-3xl p-6 flex flex-col items-center shadow-lg border-2 border-orange-100 mt-4 relative overflow-visible">
        <div className="-mt-16 mb-2">
          <CatJudgeAvatar className="w-28 h-28 drop-shadow-xl" />
        </div>
        <div className="text-center">
          <h1 className="font-black text-xl text-gray-800">猫猫巡回法庭</h1>
          <p className="text-xs text-orange-500 font-medium mt-1">
            "本喵宣判：虽然我可爱，但我超公正！喵~"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mode Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              inputMode === "text"
                ? "bg-white text-orange-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ✍️ 文字输入
          </button>
          <button
            type="button"
            onClick={() => setInputMode("voice")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              inputMode === "voice"
                ? "bg-white text-orange-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🎙️ 语音陈述
          </button>
        </div>

        {/* Common: Players Names */}
        <div className="grid grid-cols-2 gap-4">
          {/* Player A */}
          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <label className="text-xs font-bold text-blue-800 block mb-1 ml-1">
              当事人 A
            </label>
            <input
              type="text"
              placeholder="昵称 (如: 没头脑)"
              className="w-full bg-white rounded-lg border-0 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-200"
              value={formData.nameA}
              onChange={(e) =>
                setFormData({ ...formData, nameA: e.target.value })
              }
            />
          </div>

          {/* Player B */}
          <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100">
            <label className="text-xs font-bold text-red-800 block mb-1 ml-1">
              当事人 B
            </label>
            <input
              type="text"
              placeholder="昵称 (如: 不高兴)"
              className="w-full bg-white rounded-lg border-0 py-2 px-3 text-sm focus:ring-2 focus:ring-red-200"
              value={formData.nameB}
              onChange={(e) =>
                setFormData({ ...formData, nameB: e.target.value })
              }
            />
          </div>
        </div>

        {inputMode === "text" ? (
          <>
            {/* Cause Section (Required) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                <span className="text-lg">📜</span>
                案发经过 (必填)
              </label>
              <textarea
                className="w-full bg-gray-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400"
                rows={3}
                placeholder="请详细描述矛盾的起因..."
                value={formData.cause}
                onChange={(e) =>
                  setFormData({ ...formData, cause: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* Argument A */}
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                 <textarea
                    rows={3}
                    placeholder="A 的理由..."
                    className="w-full h-full bg-white/50 rounded-lg border-0 p-3 text-xs focus:ring-2 focus:ring-blue-200 resize-none"
                    value={formData.sideA}
                    onChange={(e) =>
                      setFormData({ ...formData, sideA: e.target.value })
                    }
                  />
              </div>
              {/* Argument B */}
              <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100">
                 <textarea
                    rows={3}
                    placeholder="B 的理由..."
                    className="w-full h-full bg-white/50 rounded-lg border-0 p-3 text-xs focus:ring-2 focus:ring-red-200 resize-none"
                    value={formData.sideB}
                    onChange={(e) =>
                      setFormData({ ...formData, sideB: e.target.value })
                    }
                  />
              </div>
            </div>
          </>
        ) : (
          /* Voice Mode UI */
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col items-center justify-center space-y-4">
               <div 
                 onClick={toggleRecording}
                 className={`relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                   isRecording 
                    ? "bg-red-100 shadow-[0_0_0_8px_rgba(254,202,202,0.5)] animate-pulse" 
                    : "bg-orange-100 hover:bg-orange-200"
                 }`}
               >
                 <span className="text-4xl">{isRecording ? "⏹️" : "🎙️"}</span>
               </div>
               <p className="text-sm font-medium text-gray-500">
                 {isRecording ? "正在聆听案情... (点击停止)" : "点击开始陈述案情"}
               </p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                <span className="text-lg">📝</span>
                识别结果 / 案情描述
              </label>
              <textarea
                className="w-full bg-gray-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400"
                rows={6}
                placeholder="语音识别的内容会显示在这里，您也可以手动修改..."
                value={formData.cause}
                onChange={(e) =>
                  setFormData({ ...formData, cause: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                 * 请一次性描述完整的经过和双方观点喵~
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-400 to-red-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200/50 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!formData.cause}
          >
            <span className="text-xl">🐾</span>
            <span>升堂！请求裁决！</span>
            <span className="text-xl">🐾</span>
          </button>
        </div>
      </form>
    </div>
  );
};
