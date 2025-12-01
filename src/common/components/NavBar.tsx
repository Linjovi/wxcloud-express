import React from "react";
import { ChevronLeft } from "./Icons";

interface NavBarProps {
  onBack?: () => void;
  title?: string;
  showBack?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({
  onBack,
  title = "猫猫法官",
  showBack = false,
}) => {
  return (
    <div className="sticky top-0 z-50 bg-white text-gray-800 shadow-sm px-4 h-12 flex items-center justify-between">
      <div className="w-8 flex items-center">
        {showBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-2 active:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="font-bold text-lg tracking-wide">{title}</div>
      <div className="w-8"></div> {/* Spacer for centering */}
    </div>
  );
};
