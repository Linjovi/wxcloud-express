import React from "react";
import { User, MessageSquare } from "lucide-react";

interface MemeType3Props {
  image: string | null;
  triggerUpload: (target: "main") => void;
  gifPrompt: string;
  setGifPrompt: (prompt: string) => void;
}

export const MemeType3: React.FC<MemeType3Props> = ({
  image,
  triggerUpload,
  gifPrompt,
  setGifPrompt,
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
        <label className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          想要的动作
        </label>
        <textarea
          value={gifPrompt}
          onChange={(e) => setGifPrompt(e.target.value)}
          placeholder="例如：吐一下舌头、眨眼睛、歪头杀..."
          className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-green-500 focus:bg-white outline-none transition-all text-sm resize-none h-24"
        />
      </div>

      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-700 text-sm text-center">
        点击生成后，将为你生成动图（此过程较慢，请耐心等待喵~）
      </div>
    </div>
  );
};
