import React from "react";
import { Flame, Settings2, Loader2, Wand2 } from "lucide-react";

interface ControlPanelProps {
  activeTab: "hot" | "function";
  setActiveTab: (tab: "hot" | "function") => void;
  hotStyles: Array<{ title: string }>;
  loadingHotStyles: boolean;
  selectedPreset: string | null;
  setSelectedPreset: (preset: string | null) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  loading: boolean;
  onGenerate: () => void;
  defaultPresets: Array<{ title: string }>;
  imageLoaded: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  activeTab,
  setActiveTab,
  hotStyles,
  loadingHotStyles,
  selectedPreset,
  setSelectedPreset,
  prompt,
  setPrompt,
  loading,
  onGenerate,
  defaultPresets,
  imageLoaded,
  textareaRef,
}) => {
  return (
    <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("hot")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "hot"
                ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400/20"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Flame
              className={`w-4 h-4 ${
                activeTab === "hot" ? "text-red-500" : "text-gray-400"
              }`}
            />
            热搜主题
          </button>
          <button
            onClick={() => setActiveTab("function")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "function"
                ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400/20"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Settings2
              className={`w-4 h-4 ${
                activeTab === "function" ? "text-blue-500" : "text-gray-400"
              }`}
            />
            常用功能
          </button>
        </div>

        {/* Chips Grid */}
        <div className="mb-6">
          {activeTab === "hot" && loadingHotStyles ? (
            <div className="h-24 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">寻找灵感中...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(activeTab === "hot" ? hotStyles : defaultPresets).map(
                (preset) => (
                  <button
                    key={preset.title}
                    onClick={() =>
                      setSelectedPreset(
                        selectedPreset === preset.title ? null : preset.title
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      selectedPreset === preset.title
                        ? "bg-yellow-500 text-white border-yellow-500 shadow-md transform scale-105"
                        : "bg-white text-gray-600 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
                    }`}
                  >
                    {preset.title}
                  </button>
                )
              )}
              {activeTab === "hot" && hotStyles.length === 0 && (
                <div className="w-full text-center py-4 text-gray-400 text-sm">
                  暂无推荐，试试常用功能吧~
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">
            补充描述 (可选)
          </label>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：让天空更蓝一点..."
            className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none resize-none text-sm h-24 text-gray-700 transition-all placeholder:text-gray-400"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
            {prompt.length}/200
          </div>
        </div>
      </div>

      {/* Fixed Generate Button */}
      {imageLoaded && (
        <div className="p-4 bg-white border-t border-gray-100 z-20">
          <button
            onClick={onGenerate}
            disabled={(!prompt.trim() && !selectedPreset) || loading}
            className="w-full bg-black text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
            {!prompt.trim() && !selectedPreset ? "请选择效果" : "开始生成"}
          </button>
        </div>
      )}
    </div>
  );
};

