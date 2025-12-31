import React from "react";
import { Flame, Settings2, Loader2, Wand2, Info, ImagePlus, X } from "lucide-react";
import { HotStyle } from "../types";

interface ControlPanelProps {
  activeTab: "hot" | "function";
  setActiveTab: (tab: "hot" | "function") => void;
  hotStyles: HotStyle[];
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
  backgroundImage?: string | null;
  setBackgroundImage?: (image: string | null) => void;
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
  backgroundImage,
  setBackgroundImage,
}) => {
  // Find selected style object to get source info
  const currentStyleObj =
    activeTab === "hot"
      ? hotStyles.find((s) => s.title === selectedPreset)
      : null;

  const bgInputRef = React.useRef<HTMLInputElement>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && setBackgroundImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-t-[32px] -mt-6 relative z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col backdrop-blur-sm">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 scrollbar-hide">
        {/* Modern Segmented Control */}
        <div className="flex p-1 bg-gray-100/80 rounded-2xl mb-8 relative">
          <button
            onClick={() => setActiveTab("hot")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 z-10 ${
              activeTab === "hot"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Flame
              className={`w-4 h-4 ${
                activeTab === "hot" ? "text-orange-500" : "text-gray-400"
              }`}
            />
            热门趋势
          </button>
          <button
            onClick={() => setActiveTab("function")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 z-10 ${
              activeTab === "function"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings2
              className={`w-4 h-4 ${
                activeTab === "function" ? "text-blue-500" : "text-gray-400"
              }`}
            />
            基础功能
          </button>
        </div>

        {/* Style Grid */}
        <div className="mb-8">
          {activeTab === "hot" && loadingHotStyles ? (
            <div className="h-32 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              <span className="text-xs font-medium">正在分析全网热点...</span>
            </div>
          ) : (
            <div className="space-y-4">
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
                      className={`relative px-4 py-2.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center justify-center text-center ${
                        selectedPreset === preset.title
                          ? "bg-gray-900 text-white border-transparent shadow-md transform scale-[1.02]"
                          : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      {preset.title}
                    </button>
                  )
                )}
              </div>

              {/* Background Image Upload for "更换背景" */}
              {activeTab === "function" && selectedPreset === "更换背景" && setBackgroundImage && (
                <div className="animate-fade-in-up">
                  <label className="text-xs font-bold text-gray-900 mb-2 block">
                    上传背景图
                  </label>
                  {backgroundImage ? (
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden group border border-gray-100">
                      <img
                        src={backgroundImage}
                        alt="Background"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setBackgroundImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => bgInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <ImagePlus size={24} />
                      <span className="text-xs">点击上传背景</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={bgInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleBgUpload}
                  />
                </div>
              )}

              {/* Source Info Card */}
              {activeTab === "hot" &&
                currentStyleObj &&
                currentStyleObj.source &&
                currentStyleObj.source.length > 0 && (
                  <div className="animate-fade-in-up bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-bold text-orange-600">
                        灵感来源
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentStyleObj.source.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 bg-white text-orange-700 rounded-md border border-orange-100/50 shadow-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {activeTab === "hot" && hotStyles.length === 0 && (
                <div className="w-full text-center py-8">
                  <p className="text-gray-400 text-sm mb-2">暂无热门推荐</p>
                  <button
                    onClick={() => setActiveTab("function")}
                    className="text-orange-500 text-xs font-bold hover:underline"
                  >
                    试试基础功能 →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold text-gray-900">补充细节</label>
            <span
              className={`text-[10px] font-medium ${
                prompt.length > 180 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {prompt.length}/200
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="想要画面更亮一点？或者是某种特殊的氛围？在这里告诉我..."
            className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none resize-none text-sm h-32 text-gray-800 transition-all placeholder:text-gray-400 shadow-sm"
          />
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      {imageLoaded && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-20 pb-8">
          <button
            onClick={onGenerate}
            disabled={(!prompt.trim() && !selectedPreset) || loading}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-[20px] shadow-xl shadow-gray-200 hover:shadow-2xl disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 text-[15px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                <span>正在施展魔法...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                {!prompt.trim() && !selectedPreset ? "请选择效果" : "开始生成"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

