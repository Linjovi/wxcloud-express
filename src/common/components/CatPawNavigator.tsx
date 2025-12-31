import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  return (
    <div className={`fixed right-0 bottom-32 z-50 flex items-center ${className}`}>
      {/* Cat Head - Hidden initially, slides out when expanded */}
      <Link 
        to="/"
        className={`
          transition-all duration-300 ease-in-out transform origin-right
          ${isExpanded ? 'translate-x-0 opacity-100 mr-2' : 'translate-x-full opacity-0'}
          bg-white rounded-full p-2 shadow-lg border-2 border-orange-200 cursor-pointer hover:scale-110
        `}
        title="回到首页"
      >
        <CatFaceIcon className="w-8 h-8 text-orange-500" />
      </Link>

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
