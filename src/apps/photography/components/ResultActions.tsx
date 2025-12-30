import React from "react";
import { Download, Image as ImageIcon } from "lucide-react";

interface ResultActionsProps {
  onDownload: () => void;
  onReset: () => void;
}

export const ResultActions: React.FC<ResultActionsProps> = ({
  onDownload,
  onReset,
}) => {
  return (
    <div className="bg-white relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pt-4 pb-safe-bottom">
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-800">
            🎉 美照生成完毕！
          </h3>
          <p className="text-xs text-gray-400">
            长按图片保存
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onReset}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <ImageIcon className="w-5 h-5" />
            <span>再修一张</span>
          </button>
          <button
            onClick={onDownload}
            className="flex-[2] py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>保存美照</span>
          </button>
        </div>
      </div>
    </div>
  );
};

