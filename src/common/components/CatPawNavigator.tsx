import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawIcon, CatFaceIcon } from './Icons';

interface CatPawNavigatorProps {
  className?: string;
}

export const CatPawNavigator: React.FC<CatPawNavigatorProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePawClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleHeadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/');
  };

  return (
    <div className={`absolute right-0 top-1/2 -translate-y-1/2 z-50 flex items-center ${className}`}>
      {/* Cat Head - Hidden initially, slides out when expanded */}
      <div 
        className={`
          transition-all duration-300 ease-in-out transform origin-right
          ${isExpanded ? 'translate-x-0 opacity-100 mr-2' : 'translate-x-full opacity-0'}
          bg-white rounded-full p-2 shadow-lg border-2 border-orange-200 cursor-pointer hover:scale-110
        `}
        onClick={handleHeadClick}
        title="回到首页"
      >
        <CatFaceIcon className="w-8 h-8 text-orange-500" />
      </div>

      {/* Cat Paw - Always visible, acts as the toggle */}
      <div 
        className={`
          bg-white p-2 rounded-l-xl shadow-lg border-l-2 border-t-2 border-b-2 border-orange-200 cursor-pointer
          hover:bg-orange-50 transition-colors duration-200
          ${isExpanded ? 'bg-orange-100' : ''}
        `}
        onClick={handlePawClick}
      >
        <PawIcon className="w-6 h-6 text-orange-500" />
      </div>
    </div>
  );
};
