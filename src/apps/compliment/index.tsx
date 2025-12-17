import React, { useState, useRef, useEffect } from "react";
import { ComplimentCatAvatar } from "../../common/components/Icons";
import { getCompliment, getComplimentStyles } from "./api";
import { ComplimentResponse } from "./types";
import {
  Loader2,
  Camera,
  Sparkles,
  X,
  Image as ImageIcon,
  Download,
  Flame,
  Settings2,
  Wand2,
} from "lucide-react";

interface ComplimentAppProps {
  onBack: () => void;
}

const ComplimentApp: React.FC<ComplimentAppProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<ComplimentResponse | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [hotStyles, setHotStyles] = useState<Array<{ title: string }>>([]);
  const [loadingHotStyles, setLoadingHotStyles] = useState(false);
  const [activeTab, setActiveTab] = useState<"hot" | "function">("hot");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch hot styles on mount
  useEffect(() => {
    fetchHotStyles();
  }, []);

  const fetchHotStyles = async () => {
    if (hotStyles.length > 0) return;

    setLoadingHotStyles(true);
    try {
      const styles = await getComplimentStyles();
      setHotStyles(styles);
    } catch (e) {
      console.error("Failed to fetch hot styles", e);
    } finally {
      setLoadingHotStyles(false);
    }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const defaultPresets = [
    { title: "一键美化" },
    { title: "清除路人" },
    // { title: "更换场景" },
    { title: "动漫风格" },
    // { title: "更换天气" },
  ];

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showError("请上传图片文件喵~");
      return;
    }
    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      showError("图片太大了喵，请上传10MB以内的图片~");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null); // Clear previous result
      setShowOriginal(false);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleGenerate = async () => {
    let style: string | undefined = undefined;
    let presetPrompt = null;

    if (selectedPreset) {
      style = selectedPreset;
      presetPrompt = null;
    }

    const fullPrompt = [presetPrompt, prompt].filter(Boolean).join("，");

    if (!image || (!fullPrompt.trim() && !style)) return;

    setLoading(true);
    setErrorMsg(null);

    const content = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];
    const outputSize = content.length > 800000 ? "2K" : "1K";

    try {
      await getCompliment(
        content,
        fullPrompt,
        mimeType,
        outputSize,
        style,
        (progressData) => {
          if (progressData.progress) {
            setProgress(progressData.progress);
          }
          if (progressData.status === "running") {
            setStatusMessage("正在绘制喵...");
          }
        },
        (finalResult) => {
          if (finalResult.error) {
            showError(finalResult.error);
          } else {
            setResult(finalResult);
            setShowOriginal(false);
          }
          setLoading(false);
          setProgress(0);
        }
      );
    } catch (error) {
      showError("夸夸喵好像睡着了，请稍后再试喵~");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPrompt("");
    setResult(null);
    setShowOriginal(false);
    setSelectedPreset(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearImage = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      let href = "";
      if (result.imageUrl) {
        const response = await fetch(result.imageUrl);
        const blob = await response.blob();
        href = URL.createObjectURL(blob);
      } else if (result.base64Image) {
        href = `data:image/jpeg;base64,${result.base64Image}`;
      }

      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.download = `compliment-cat-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (result.imageUrl) URL.revokeObjectURL(href);
      }
    } catch (e) {
      console.error("Download failed", e);
      showError("保存失败，请长按图片保存喵~");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col font-sans overflow-hidden">
      {/* Toast Error */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-fade-in-up flex items-center gap-2">
          <span className="text-sm font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Top Image Area - Fixed Height */}
      <div className="relative w-full h-[35vh] bg-gray-100 flex-shrink-0 flex items-center justify-center">
        {result ? (
          // Result View
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={
                showOriginal
                  ? image!
                  : result.imageUrl ||
                    `data:image/jpeg;base64,${result.base64Image}`
              }
              alt="Result"
              className="w-full h-full object-contain block transition-opacity duration-200 p-4"
            />

            {/* Comparison Button */}
            <button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md z-10 active:scale-95 transition-transform"
            >
              {showOriginal ? "松开看结果" : "按住看原图"}
            </button>
          </div>
        ) : image ? (
          // Uploaded Image View
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={image}
              alt="Original"
              className="w-full h-full object-contain block p-4"
            />
            <button
              onClick={handleClearImage}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          // Empty State
          <div
            className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200/50 transition-colors w-full h-full text-gray-600"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-gray-100">
              <Camera className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-gray-800">上传照片</h3>
            <p className="text-gray-500 text-sm text-center max-w-xs">
              让夸夸喵为你施展魔法
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="relative">
              <ComplimentCatAvatar className="w-24 h-24 mb-6 animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {statusMessage || "让本喵思考一下..."}
            </h3>
            <p className="text-gray-500 text-sm mb-6">请耐心等待一小会儿喵~</p>

            {progress > 0 && (
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {progress > 0 && (
              <span className="text-xs text-gray-400 mt-2">{progress}%</span>
            )}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Controls Area - Scrollable */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {image && !result ? (
            <>
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
                      activeTab === "function"
                        ? "text-blue-500"
                        : "text-gray-400"
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
                              selectedPreset === preset.title
                                ? null
                                : preset.title
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
            </>
          ) : result ? (
            <div className="flex flex-col items-center justify-center h-full pb-10 animate-fade-in-up">
              <h3 className="text-xl font-black text-gray-800 mb-6">
                🎉 美照生成完毕！
              </h3>
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={handleDownload}
                  className="py-4 bg-yellow-400 text-white font-bold rounded-2xl hover:bg-yellow-500 shadow-lg shadow-yellow-200 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Download className="w-6 h-6 mb-1" />
                  <span>保存美照</span>
                </button>
                <button
                  onClick={handleReset}
                  className="py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span>再修一张</span>
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-6">
                提示：如果保存失败，请长按图片手动保存
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm pb-10">
              <Sparkles className="w-8 h-8 mb-2 text-gray-300" />
              <p>上传照片后即可开始修图</p>
            </div>
          )}
        </div>

        {/* Fixed Generate Button */}
        {image && !result && (
          <div className="p-4 bg-white border-t border-gray-100 z-20">
            <button
              onClick={handleGenerate}
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
    </div>
  );
};

export default ComplimentApp;
