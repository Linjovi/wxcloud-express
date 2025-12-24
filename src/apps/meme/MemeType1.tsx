import React from "react";
import { User } from "lucide-react";

interface MemeType1Props {
  image: string | null;
  style: "cartoon" | "realistic";
  setStyle: (style: "cartoon" | "realistic") => void;
  triggerUpload: (target: "main") => void;
}

export const MemeType1: React.FC<MemeType1Props> = ({
  image,
  style,
  setStyle,
  triggerUpload,
}) => {
  return (
    <div className="space-y-6">
      <div
        onClick={() => triggerUpload("main")}
        className="relative aspect-square rounded-2xl border-2 border-dashed border-green-200 bg-white hover:bg-green-50 transition-colors cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden group"
      >
        {image ? (
          <img
            src={image}
            alt="Main"
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-bold text-gray-400">上传主角</span>
          </>
        )}
        {image && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
              点击更换
            </span>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <label className="text-sm font-bold text-gray-500 mb-3 block">
          选择风格
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setStyle("cartoon")}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              style === "cartoon"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="text-2xl">🎨</span>
            <span className="font-bold text-sm">卡通版</span>
          </button>
          <button
            onClick={() => setStyle("realistic")}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              style === "realistic"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="text-2xl">📸</span>
            <span className="font-bold text-sm">写实版</span>
          </button>
        </div>
      </div>
    </div>
  );
};

