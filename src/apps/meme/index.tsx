import React, { useState, useRef, useEffect } from "react";
import { ArrowLeftIcon } from "../../common/components/Icons";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Download, RotateCcw, Timer } from "lucide-react";
import { MemeType1 } from "./MemeType1";
import { MemeType2 } from "./MemeType2";
import { MemeType3 } from "./MemeType3";
import gifshot from "gifshot";

type StyleType = "cartoon" | "realistic";
type MemeType = 1 | 2 | 3; // 1: 9-grid, 2: Expression Transfer, 3: GIF

// Helper function to crop 4x4 sprite sheet into frames
const sliceSpriteSheet = (imgUrl: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const frames: string[] = [];
      const rows = 4;
      const cols = 4;
      const frameWidth = img.width / cols;
      const frameHeight = img.height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement("canvas");
          canvas.width = frameWidth;
          canvas.height = frameHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              img,
              c * frameWidth,
              r * frameHeight,
              frameWidth,
              frameHeight,
              0,
              0,
              frameWidth,
              frameHeight
            );
            frames.push(canvas.toDataURL("image/png"));
          }
        }
      }
      resolve(frames);
    };
    img.onerror = (err) => reject(err);
    img.src = imgUrl;
  });
};

const createGif = (frames: string[], fps: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    // gifshot expects interval in seconds per frame
    // fps = frames per second. interval = 1 / fps
    const interval = 1 / fps;

    gifshot.createGIF(
      {
        images: frames,
        interval: interval,
        gifWidth: 400, // Reasonable default size
        gifHeight: 400,
        numFrames: frames.length,
      },
      (obj: any) => {
        if (!obj.error) {
          resolve(obj.image);
        } else {
          reject(obj.errorMsg);
        }
      }
    );
  });
};

const MemeApp: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<MemeType>(1);
  const [image, setImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null); // For Type 2
  const [uploadTarget, setUploadTarget] = useState<"main" | "ref">("main"); // Which image is being uploaded
  const [gifPrompt, setGifPrompt] = useState(""); // For Type 3
  const [fps, setFps] = useState(8); // Default FPS for Type 3

  const [style, setStyle] = useState<StyleType>("realistic");
  const [description, setDescription] = useState(""); // For Type 1 description
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedFrames, setGeneratedFrames] = useState<string[] | null>(null); // Store frames for FPS adjustment
  const [error, setError] = useState<string | null>(null);

  // Check for pending task on mount
  useEffect(() => {
    const checkPendingTask = async () => {
      const storedTask = localStorage.getItem("huluhulu_meme_task");
      if (!storedTask) return;

      try {
        const {
          id,
          type,
          timestamp,
          image: savedImage,
          refImage: savedRefImage,
        } = JSON.parse(storedTask);
        // Expire after 1 hour (optional, but good practice)
        if (Date.now() - timestamp > 60 * 60 * 1000) {
          localStorage.removeItem("huluhulu_meme_task");
          return;
        }

        // Restore context
        setActiveTab(type);
        if (savedImage) setImage(savedImage);
        if (savedRefImage) setRefImage(savedRefImage);

        setLoading(true);
        setProgress(50); // Show some progress

        // Poll for result
        await pollTask(id, type);
      } catch (e) {
        console.error("Error checking pending task:", e);
        localStorage.removeItem("huluhulu_meme_task");
      }
    };

    checkPendingTask();
  }, []);

  const pollTask = async (id: string, type: MemeType) => {
    try {
      const res = await fetch(`/api/image/meme-result?id=${id}`);
      const data = await res.json();

      if (data.code !== 0) {
        throw new Error(data.message || "查询任务失败");
      }

      const taskData = data.data?.data || data.data; // Handle nested data structure if present, or flat
      // Structure: { id, results: [{url}], status, progress, ... }

      if (taskData.status === "succeeded") {
        // Handle success
        if (
          taskData.results &&
          taskData.results.length > 0 &&
          taskData.results[0].url
        ) {
          const url = taskData.results[0].url;

          if (type === 3) {
            // For GIF, we need to process the sprite sheet
            try {
              const frames = await sliceSpriteSheet(url);
              setGeneratedFrames(frames);
              const gifDataUrl = await createGif(frames, fps);
              setGeneratedImage(gifDataUrl);
            } catch (e) {
              console.error("Failed to process restored GIF", e);
              setError("动图处理失败了喵~");
            }
          } else {
            setGeneratedImage(url);
          }
        }
        localStorage.removeItem("huluhulu_meme_task");
        setLoading(false);
        setProgress(100);
      } else if (taskData.status === "failed") {
        localStorage.removeItem("huluhulu_meme_task");
        throw new Error(taskData.failure_reason || "任务失败了喵~");
      } else {
        // Running / Pending
        if (taskData.progress) {
          setProgress(taskData.progress);
        }
        // Poll again in 2 seconds
        setTimeout(() => pollTask(id, type), 2000);
      }
    } catch (e: any) {
      setError(e.message || "恢复任务失败了喵~");
      setLoading(false);
      localStorage.removeItem("huluhulu_meme_task");
    }
  };

  // Auto-scroll to result when generated
  useEffect(() => {
    if (generatedImage && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [generatedImage]);

  // Regenerate GIF when FPS changes (only for Type 3 with saved frames)
  useEffect(() => {
    if (activeTab === 3 && generatedFrames && generatedFrames.length > 0) {
      createGif(generatedFrames, fps)
        .then((gifDataUrl) => {
          setGeneratedImage(gifDataUrl);
        })
        .catch((err) => {
          console.error("Failed to regenerate GIF with new FPS:", err);
        });
    }
  }, [fps, generatedFrames, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("图片大小不能超过 5MB 喵~");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (uploadTarget === "main") {
          setImage(result);
        } else {
          setRefImage(result);
        }
        setError(null);
      };
      reader.readAsDataURL(file);
    }
    // Reset value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (target: "main" | "ref") => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!image) return;
    if (activeTab === 2 && !refImage) {
      setError("请上传参考表情图喵~");
      return;
    }
    if (activeTab === 3 && !gifPrompt.trim()) {
      setError("请输入想要生成的动作喵~");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setGeneratedImage(null);
    setGeneratedFrames(null); // Clear previous frames

    let hasResult = false;
    let spriteSheetUrl: string | null = null;
    // let spriteSheetBase64: string | null = null; // Removed

    try {
      const response = await fetch("/api/image/meme-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: activeTab,
          image,
          refImage: activeTab === 2 ? refImage : undefined,
          style: activeTab === 1 ? style : undefined,
          description: activeTab === 1 ? description : undefined,
          gifPrompt: activeTab === 3 ? gifPrompt : undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "生成失败了喵~");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              localStorage.removeItem("huluhulu_meme_task"); // Clean up on normal finish
              break;
            }
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              // Save task ID for recovery
              if (data.id) {
                localStorage.setItem(
                  "huluhulu_meme_task",
                  JSON.stringify({
                    id: data.id,
                    type: activeTab,
                    image, // Save current images to context
                    refImage: activeTab === 2 ? refImage : undefined,
                    timestamp: Date.now(),
                  })
                );
              }

              if (data.status === "running") {
                if (data.progress) {
                  setProgress(Math.round(data.progress));
                }
              } else if (data.status === "succeeded") {
                if (
                  data.results &&
                  data.results.length > 0 &&
                  data.results[0].url
                ) {
                  if (activeTab === 3) {
                    spriteSheetUrl = data.results[0].url;
                  } else {
                    setGeneratedImage(data.results[0].url);
                  }
                  hasResult = true;
                }
                setProgress(100);
              } else if (data.status === "failed") {
                throw new Error(data.failure_reason || "生成失败了喵~");
              }

              if (!hasResult) {
                // No fallback needed as interface guarantees URL
              }
            } catch (e) {
              console.error("Error parsing stream data", e);
            }
          }
        }
      }

      if (!hasResult) {
        throw new Error("生成失败，未获取到结果喵~");
      }

      localStorage.removeItem("huluhulu_meme_task"); // Clean up on success

      // If Type 3, process the sprite sheet into a GIF
      if (activeTab === 3 && hasResult) {
        const source = spriteSheetUrl;
        if (source) {
          setProgress(100); // Ensure progress shows full while processing GIF
          try {
            const frames = await sliceSpriteSheet(source);
            setGeneratedFrames(frames); // Save frames for FPS adjustment
            const gifDataUrl = await createGif(frames, fps);
            setGeneratedImage(gifDataUrl);
          } catch (gifErr) {
            console.error("GIF creation error:", gifErr);
            throw new Error("动图合成失败了喵~");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "网络出了点小差错，请稍后再试喵~");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setRefImage(null);
    setDescription("");
    setGeneratedImage(null);
    setGeneratedFrames(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isReadyToGenerate = () => {
    if (activeTab === 1) return !!image;
    if (activeTab === 2) return !!image && !!refImage;
    if (activeTab === 3) return !!image && !!gifPrompt.trim();
    return false;
  };

  const onImageUpload = (type: "main" | "ref", file: File) => {
    // This is handled by handleFileChange via ref, but we could make it more direct
    // Kept the ref logic for consistency with previous implementation
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        <div className="flex bg-white p-1 rounded-xl mb-6 shadow-sm border border-green-100">
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 1
                ? "bg-green-100 text-green-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span>九宫格</span>
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 2
                ? "bg-green-100 text-green-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span>表情模仿</span>
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 3
                ? "bg-green-100 text-green-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span>GIF动图</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col space-y-6">
          {activeTab === 1 && (
            <MemeType1
              image={image}
              style={style}
              setStyle={setStyle}
              triggerUpload={triggerUpload}
              description={description}
              setDescription={setDescription}
            />
          )}
          {activeTab === 2 && (
            <MemeType2
              image={image}
              refImage={refImage}
              onImageUpload={onImageUpload}
              triggerUpload={triggerUpload}
              fileInputRef={fileInputRef}
            />
          )}
          {activeTab === 3 && (
            <MemeType3
              image={image}
              triggerUpload={triggerUpload}
              gifPrompt={gifPrompt}
              setGifPrompt={setGifPrompt}
            />
          )}

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>正在施展魔法...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div
                  className="h-full bg-green-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Generate Button (Disabled during loading) */}
          <button
            onClick={handleGenerate}
            disabled={loading || !isReadyToGenerate()}
            className="w-full bg-green-500 text-white py-4 rounded-full font-bold shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {loading ? "制作中..." : activeTab === 3 ? "生成动图" : "立即生成"}
          </button>

          {/* Result Section (Shows below button) */}
          {generatedImage && (
            <div
              ref={resultRef}
              className="flex flex-col space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden relative min-h-[300px] flex items-center justify-center">
                <img
                  src={generatedImage}
                  alt="Generated Meme"
                  className="w-full h-auto"
                />
              </div>

              {/* FPS Control for Type 3 (Only shown after generation) */}
              {activeTab === 3 && generatedFrames && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                  <label className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    动画速度 (FPS: {fps})
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">慢</span>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={fps}
                      onChange={(e) => setFps(parseInt(e.target.value))}
                      className="flex-1 accent-green-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400">快</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  清空
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = generatedImage!;
                    link.download = `meme-${Date.now()}.gif`; // Changed to gif extension for Type 3 mostly, but handles jpg/png via browser behavior usually.
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-[2] bg-black text-white py-3.5 rounded-full font-bold shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  保存图片
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default MemeApp;
