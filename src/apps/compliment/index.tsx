import React, { useState, useRef } from "react";
import {
  ComplimentCatAvatar,
  SparklesIcon,
} from "../../common/components/Icons";
import { getCompliment } from "./api";
import { ComplimentResponse } from "./types";
import { Loader2, Upload, Camera, Share2 } from "lucide-react";

interface ComplimentAppProps {
  onBack: () => void;
}

const ComplimentApp: React.FC<ComplimentAppProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplimentResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件喵~");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      // Remove data URL prefix for API if needed, but our backend handles splitting or we can send full string
      // The backend expects "base64 string (without data:image/... prefix)" based on my comment there,
      // but usually libraries handle full data URI or we strip it.
      // Let's strip it here to be safe and match the backend expectation comment:
      // "const { image } = await req.json(); // Expecting base64 string (without data:image/... prefix)"

      const content = base64String.split(",")[1];
      setImage(base64String); // Display full string
      setLoading(true);

      try {
        const data = await getCompliment(content);
        setResult(data);


      } catch (error) {
        alert("夸夸喵好像睡着了，请稍后再试喵~");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            专业彩虹屁 · 治愈不开心
          </p>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-yellow-100 min-h-[400px] flex flex-col relative">
        {/* Main Content Area */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
          {!image ? (
            // Upload State
            <div
              className="w-full h-64 border-4 border-dashed border-yellow-200 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-yellow-50 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-yellow-400 font-bold text-lg">
                点击上传你的美照
              </p>
              <p className="text-xs text-yellow-300">
                或者是任何你想被夸的东西喵~
              </p>
            </div>
          ) : (
            // Display Image
            <div className="relative w-full rounded-2xl overflow-hidden shadow-md group">
              <img
                src={image}
                alt="Upload"
                className="w-full h-auto object-cover max-h-[400px]"
              />
              {!loading && result && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <button
                    onClick={handleReset}
                    className="text-white/80 text-xs hover:text-white underline"
                  >
                    再来一张
                  </button>
                </div>
              )}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <ComplimentCatAvatar className="w-24 h-24 mb-4 animate-bounce" />
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>正在酝酿彩虹屁...</span>
              </div>
            </div>
          )}

          {/* Result State */}
          {result && !loading && (
            <div className="w-full mt-6 animate-fade-in-up space-y-4">
              {/* Error Hint for Invalid Subject */}
              {!result.validSubject ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                  <p className="text-red-500 font-bold mb-2">喵呜？</p>
                  <p className="text-red-400 text-sm">{result.errorHint}</p>
                </div>
              ) : (
                <>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {result.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-yellow-100 text-yellow-600 text-xs font-bold px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    <span className="bg-red-100 text-red-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      萌力值 {result.score} <SparklesIcon className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Cat Breed Lookalike */}
                  {result.catBreed && (
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-3">
                      <div>
                        <h3 className="text-orange-800 font-bold text-sm mb-1">
                          猫系长相鉴定
                        </h3>
                        <p className="text-orange-600 text-xs leading-relaxed">
                          {result.catBreed}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Outfit Evaluation */}
                  {result.outfitEvaluation && (
                    <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-purple-800 font-bold text-sm">
                          穿搭点评
                        </h3>
                        <span className="bg-purple-200 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {result.outfitScore}分
                        </span>
                      </div>
                      <p className="text-purple-600 text-xs leading-relaxed italic">
                        “{result.outfitEvaluation}”
                      </p>
                      {result.outfitAdvice && (
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <p className="text-purple-800 text-xs font-bold mb-1">💡 喵喵小建议：</p>
                          <p className="text-purple-600 text-xs leading-relaxed">
                            {result.outfitAdvice}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compliment Text */}
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 relative">
                    <div className="absolute -top-3 -left-2 text-4xl text-yellow-300">
                      ❝
                    </div>
                    <p className="text-gray-700 font-medium leading-relaxed text-justify indent-4 relative z-10">
                      {result.compliment}
                    </p>
                    <div className="absolute -bottom-6 -right-2 text-4xl rotate-180 text-yellow-300">
                      ❝
                    </div>
                  </div>

                  {/* Pickup Line */}
                  {result.pickupLine && (
                    <div className="relative mt-2 mx-2">
                      <div className="bg-white border-2 border-yellow-400 rounded-2xl p-3 shadow-sm relative z-10">
                        <p className="text-yellow-600 font-bold text-sm text-center">
                          “{result.pickupLine}”
                        </p>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r-2 border-b-2 border-yellow-400 rotate-45 z-0"></div>
                    </div>
                  )}


                </>
              )}

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleReset}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-yellow-200 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> 再夸夸别的
                </button>
              </div>
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
