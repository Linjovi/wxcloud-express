import React from "react";
import { PhotographyCatAvatar } from "../../../common/components/Icons";
import { PhotographyResponse } from "../types";
import { Sparkles, X, Camera } from "lucide-react";

interface ImageDisplayProps {
  image: string | null;
  result: PhotographyResponse | null;
  loading: boolean;
  progress: number;
  statusMessage: string;
  showOriginal: boolean;
  setShowOriginal: (show: boolean) => void;
  onClearImage: () => void;
  onUploadClick: () => void;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  image,
  result,
  loading,
  progress,
  statusMessage,
  showOriginal,
  setShowOriginal,
  onClearImage,
  onUploadClick,
}) => {
  return (
    <div className={`relative w-full ${result ? "flex-1" : "h-[35vh]"} bg-gray-100 flex-shrink-0 flex items-center justify-center transition-all duration-300`}>
      {result ? (
        // Result View
        <div className="relative w-full h-full flex items-center justify-center bg-black/90">
          <img
            src={
              showOriginal
                ? image!
                : result.imageUrl ||
                  `data:image/jpeg;base64,${result.base64Image}`
            }
            alt="Result"
            className="w-full h-full object-contain block transition-opacity duration-200"
          />

          {/* Comparison Button */}
          <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-6 py-2.5 rounded-full backdrop-blur-md z-10 active:scale-95 transition-transform border border-white/20 shadow-lg"
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
            onClick={onClearImage}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        // Empty State
        <div
          className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200/50 transition-colors w-full h-full text-gray-600"
          onClick={onUploadClick}
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
            <PhotographyCatAvatar className="w-24 h-24 mb-6 animate-bounce" />
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
  );
};

