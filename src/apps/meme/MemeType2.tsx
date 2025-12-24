import React, { useRef, useState } from "react";
import { User, Smile, Upload } from "lucide-react";

interface MemeType2Props {
  image: string | null;
  refImage: string | null;
  onImageUpload: (type: "main" | "ref", file: File) => void;
  triggerUpload: (target: "main" | "ref") => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const MemeType2: React.FC<MemeType2Props> = ({
  image,
  refImage,
  triggerUpload,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Main Image Upload */}
      <div
        onClick={() => triggerUpload("main")}
        className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-green-200 bg-white hover:bg-green-50 transition-colors cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden group"
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

      {/* Reference Image Upload */}
      <div
        onClick={() => triggerUpload("ref")}
        className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-blue-200 bg-white hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden group"
      >
        {refImage ? (
          <img
            src={refImage}
            alt="Reference"
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Smile className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-gray-400">
              上传表情参考
            </span>
          </>
        )}
        {refImage && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
              点击更换
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

