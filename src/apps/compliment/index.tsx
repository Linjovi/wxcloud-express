import React, { useState, useRef, useEffect } from "react";
import {
  ComplimentCatAvatar,
  SparklesIcon,
} from "../../common/components/Icons";
import { getCompliment, getComplimentStyles } from "./api";
import { ComplimentResponse } from "./types";
import { Loader2, Upload, Camera, Share2, ChevronDown, Check } from "lucide-react";

interface ComplimentAppProps {
  onBack: () => void;
}

const ComplimentApp: React.FC<ComplimentAppProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplimentResponse | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [hotStyles, setHotStyles] = useState<Array<{ title: string }>>([]);
  const [loadingHotStyles, setLoadingHotStyles] = useState(false);
  const [showHotStyles, setShowHotStyles] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchHotStyles = async () => {
    if (hotStyles.length > 0) {
      setShowHotStyles(true);
      return;
    }

    setLoadingHotStyles(true);
    try {
      const styles = await getComplimentStyles();
      setHotStyles(styles);
      setShowHotStyles(true);
    } catch (e) {
      console.error("Failed to fetch hot styles", e);
      alert("获取灵感失败了喵~");
    } finally {
      setLoadingHotStyles(false);
    }
  };

  const toggleHotStyles = () => {
    if (showHotStyles) {
      setShowHotStyles(false);
    } else {
      fetchHotStyles();
    }
  };

  const defaultPresets = [
    { title: "清除路人" },
    { title: "更换场景" },
    { title: "一键美化" },
    { title: "动漫风格" },
    { title: "更换天气" },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件喵~");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null); // Clear previous result
      setShowOriginal(false);
    };
    reader.readAsDataURL(file);
  };
  // ... (skip unchanged handleGenerate) ...
  const handleGenerate = async () => {
    // Determine if selectedPreset is a hot style title
    let style: string | undefined = undefined;
    let presetPrompt = null;

    if (selectedPreset) {
      style = selectedPreset;
      presetPrompt = null; // Don't include the title in the prompt text
    }

    // Combine preset and user input
    const fullPrompt = [presetPrompt, prompt].filter(Boolean).join("，");

    if (!image || (!fullPrompt.trim() && !style)) return;

    setLoading(true);
    const content = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    // Simple heuristic: if base64 string > 800KB (approx 600KB file), use 2K, else 1K
    const outputSize = content.length > 800000 ? "2K" : "1K";

    try {
      const data = await getCompliment(
        content,
        fullPrompt,
        mimeType,
        outputSize,
        style
      );
      setResult(data);
      setShowOriginal(false); // Show result by default
    } catch (error) {
      alert("夸夸喵好像睡着了，请稍后再试喵~");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPrompt("");
    setResult(null);
    setShowOriginal(false);
    setSelectedPreset(null); // Reset selected preset
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ... inside component ...
  const handleDownload = () => {
    if (!result?.base64Image) return;
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${result.base64Image}`;
    link.download = `compliment-cat-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center p-4 pt-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ComplimentCatAvatar className="w-16 h-16 shadow-lg" />
        <div>
          <h1 className="text-2xl font-black text-yellow-600 tracking-wider">
            夸夸喵
          </h1>
          <p className="text-xs text-yellow-500 font-bold opacity-80">
            在本喵眼里，你永远是最完美的模样
          </p>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-yellow-100 min-h-[500px] flex flex-col items-start relative">
        <div className="w-full flex-1 p-6 flex flex-col items-center relative">

          {/* Image Display Area */}
          <div className="w-full relative rounded-2xl overflow-hidden shadow-md bg-gray-100 min-h-[200px]">
            {result?.base64Image && !showOriginal ? (
              <img src={`data:image/jpeg;base64,${result.base64Image}`} alt="Result" className="w-full h-auto object-contain" />
            ) : image ? (
              <img src={image} alt="Original" className="w-full h-auto object-contain" />
            ) : (
              <div
                className="w-full h-64 flex flex-col items-center justify-center cursor-pointer text-gray-400 gap-2 hover:bg-gray-200 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-10 h-10 text-yellow-400" />
                <span className="text-sm">点击上传照片</span>
              </div>
            )}

            {/* Comparison Toggle Button Overlay */}
            {result && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                  className="bg-black/50 hover:bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer select-none"
                >
                  {showOriginal ? "松开看结果" : "按住看原图"}
                </button>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <ComplimentCatAvatar className="w-20 h-20 mb-4 animate-bounce" />
                <p className="text-yellow-500 font-bold animate-pulse">本喵正在施法...</p>
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


          {/* Controls Area */}
          {image && !result && (
            <div className="w-full mt-6 space-y-4 animate-fade-in-up">

              {/* Quick Presets Dropdown */}
              <div className="relative mb-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-yellow-200 rounded-xl text-sm font-bold text-gray-700 hover:border-yellow-400 transition-colors"
                >
                  <span className="truncate">
                    {selectedPreset
                      ? (showHotStyles ? hotStyles : defaultPresets).find((p) => p.title === selectedPreset)?.title ||
                        defaultPresets.find(p => p.title === selectedPreset)?.title || 
                        hotStyles.find(p => p.title === selectedPreset)?.title ||
                        selectedPreset
                      : "✨ 选择修图风格"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-yellow-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-yellow-100 rounded-xl shadow-xl z-20 overflow-hidden max-h-60 flex flex-col animate-fade-in-up">
                    <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin scrollbar-thumb-yellow-200 scrollbar-track-transparent">
                      {(showHotStyles ? hotStyles : defaultPresets).map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => {
                            setSelectedPreset(preset.title);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-between ${selectedPreset === preset.title
                            ? "bg-yellow-50 text-yellow-600"
                            : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          <span className="text-left">{preset.title}</span>
                          {selectedPreset === preset.title && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
                        </button>
                      ))}
                      {showHotStyles && hotStyles.length === 0 && !loadingHotStyles && (
                        <div className="p-4 text-center text-gray-400 text-xs">
                          暂无合适的热搜灵感喵~
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={toggleHotStyles}
                        disabled={loadingHotStyles}
                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-red-500 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {loadingHotStyles ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "🔥"
                        )}
                        {showHotStyles ? "返回常用预设" : "找点热搜灵感"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="告诉本喵你想怎么修？选择上方快捷指令，或自己输入..."
                  className="w-full p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200 focus:border-yellow-400 outline-none resize-none text-sm h-32 text-gray-700 placeholder:text-gray-400"
                />
                <div className="absolute bottom-3 right-3 text-xs text-yellow-400">
                  {prompt.length}/200
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={(!prompt.trim() && !selectedPreset) || loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-full shadow-lg shadow-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-5 h-5" /> 开始施法
              </button>
            </div>
          )}

          {/* Reset / Action Buttons */}
          {result && (
            <div className="w-full mt-6 flex gap-3 flex-col">
              <div className="flex gap-3">
                <button onClick={handleDownload} className="flex-1 py-3 bg-yellow-400 text-white font-bold rounded-full hover:bg-yellow-500 shadow-lg shadow-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" /> 保存美照
                </button>
                <button onClick={handleReset} className="flex-1 py-3 border-2 border-yellow-400 text-yellow-600 font-bold rounded-full hover:bg-yellow-50 transition-colors">
                  再修一张
                </button>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="mt-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center font-bold">
              {result.error}
            </div>
          )}

        </div>
      </div>

      <button
        onClick={onBack}
        className="mt-8 text-yellow-600/50 text-sm font-bold hover:text-yellow-600 transition-colors"
      >
        ← 返回事务所
      </button>
    </div>
  );
};

export default ComplimentApp;
