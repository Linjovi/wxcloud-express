import React, { useState, useRef, useEffect } from "react";
import { getPhotography, pollPhotographyTask } from "./api";
import { PhotographyResponse } from "./types";
import { Sparkles } from "lucide-react";
import { ImageDisplay } from "./components/ImageDisplay";
import { ControlPanel } from "./components/ControlPanel";
import { ResultActions } from "./components/ResultActions";
import { useHotStyles } from "./hooks/useHotStyles";

interface PhotographyAppProps {
  onBack: () => void;
}

const PhotographyApp: React.FC<PhotographyAppProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<PhotographyResponse | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hot" | "function">("hot");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom hook for hot styles
  const { hotStyles, loadingHotStyles } = useHotStyles();

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  // Restore task from local storage
  useEffect(() => {
    const checkPendingTask = async () => {
      const storedTask = localStorage.getItem("huluhulu_photography_task");
      if (!storedTask) return;

      try {
        const {
          id,
          image: savedImage,
          prompt: savedPrompt,
          selectedPreset: savedPreset,
          activeTab: savedActiveTab,
          backgroundImage: savedBgImage,
          timestamp,
        } = JSON.parse(storedTask);

        // Expire after 1 hour
        if (Date.now() - timestamp > 60 * 60 * 1000) {
          localStorage.removeItem("huluhulu_photography_task");
          return;
        }

        // Restore context
        setImage(savedImage);
        setPrompt(savedPrompt || "");
        setSelectedPreset(savedPreset);
        if (savedActiveTab) setActiveTab(savedActiveTab);
        if (savedBgImage) setBackgroundImage(savedBgImage);

        setLoading(true);
        setStatusMessage("正在恢复任务...");

        // Poll for result
        await pollTask(id);
      } catch (e) {
        console.error("Error checking pending task:", e);
        localStorage.removeItem("huluhulu_photography_task");
      }
    };

    checkPendingTask();
  }, []);

  const pollTask = async (id: string) => {
    try {
      const data = await pollPhotographyTask(id);
      
      if (data.status === "succeeded") {
        if (data.results && data.results.length > 0 && data.results[0].url) {
          setResult({ imageUrl: data.results[0].url });
          setShowOriginal(false);
        }
        setLoading(false);
        setProgress(0);
        localStorage.removeItem("huluhulu_photography_task");
      } else if (data.status === "failed") {
        showError(data.failure_reason || "任务失败了喵~");
        setLoading(false);
        localStorage.removeItem("huluhulu_photography_task");
      } else {
        // Running
        if (data.progress) {
          setProgress(data.progress);
        }
        setStatusMessage("正在绘制喵...");
        setTimeout(() => pollTask(id), 2000);
      }
    } catch (e) {
      console.error("Poll error", e);
      showError("恢复任务失败了喵~");
      setLoading(false);
      localStorage.removeItem("huluhulu_photography_task");
    }
  };

  const defaultPresets = [
    { title: "一键美化" },
    { title: "清除路人" },
    { title: "更换背景" },
    { title: "动漫风格" },
    { title: "更换天气" },
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
    const bgImageContent = backgroundImage ? backgroundImage.split(",")[1] : undefined;

    try {
      await getPhotography(
        content,
        fullPrompt,
        mimeType,
        outputSize,
        style,
        bgImageContent,
        (progressData) => {
          // Save task ID for recovery
          if (progressData.id) {
            localStorage.setItem(
              "huluhulu_photography_task",
              JSON.stringify({
                id: progressData.id,
                image,
                prompt,
                selectedPreset,
                activeTab,
                backgroundImage,
                timestamp: Date.now(),
              })
            );
          }

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
          localStorage.removeItem("huluhulu_photography_task");
        }
      );
    } catch (error) {
      showError("夸夸喵好像睡着了，请稍后再试喵~");
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Retain image and settings for "Edit Another"
    setResult(null);
    setShowOriginal(false);
    localStorage.removeItem("huluhulu_photography_task");
  };

  const handleClearImage = () => {
    setImage(null);
    setResult(null);
    localStorage.removeItem("huluhulu_photography_task");
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
        link.download = `photography-cat-${Date.now()}.jpg`;
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
      <h1 className="sr-only">猫猫摄影师 - AI照片修图与美化</h1>
      {/* Toast Error */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-fade-in-up flex items-center gap-2">
          <span className="text-sm font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Top Image Area */}
      <ImageDisplay
        image={image}
        result={result}
        loading={loading}
        progress={progress}
        statusMessage={statusMessage}
        showOriginal={showOriginal}
        setShowOriginal={setShowOriginal}
        onClearImage={handleClearImage}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Controls Area */}
      {image && !result ? (
        <ControlPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hotStyles={hotStyles}
          loadingHotStyles={loadingHotStyles}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          prompt={prompt}
          setPrompt={setPrompt}
          loading={loading}
          onGenerate={handleGenerate}
          defaultPresets={defaultPresets}
          imageLoaded={!!image}
          textareaRef={textareaRef}
          backgroundImage={backgroundImage}
          setBackgroundImage={setBackgroundImage}
        />
      ) : result ? (
        <ResultActions onDownload={handleDownload} onReset={handleReset} />
      ) : (
        // Empty State Bottom Panel
        <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm pb-10">
              <Sparkles className="w-8 h-8 mb-2 text-gray-300" />
              <p>上传照片后即可开始修图</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotographyApp;
