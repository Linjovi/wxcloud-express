import React from 'react';
import { RefreshCw } from 'lucide-react';
import { CARD_BACK_URL } from '../../constants';

const ShufflingStage: React.FC = () => {
    // Increase card count for better visual
    const cardCount = 16;
    
    return (
        <div className="flex flex-col items-center justify-center space-y-16 py-12">
            <div className="relative w-48 h-72 perspective-1000">
                {[...Array(cardCount)].map((_, i) => {
                    const isEven = i % 2 === 0;
                    // Half cards go left, half go right
                    const direction = isEven ? -1 : 1; 
                    
                    // Add some randomness to the spread
                    const randomRot = (Math.random() - 0.5) * 10;
                    const randomX = (Math.random() - 0.5) * 10;
                    const randomY = (Math.random() - 0.5) * 10;

                    return (
                        <div
                            key={i}
                            className="absolute inset-0 rounded-xl bg-indigo-950 border border-yellow-500/20 shadow-2xl card-shuffle-item"
                            style={{
                                // Custom properties for animation
                                '--split-dir': direction,
                                '--rand-rot': `${randomRot}deg`,
                                '--rand-x': `${randomX}px`,
                                '--rand-y': `${randomY}px`,
                                '--index': i,
                                zIndex: i,
                                animationDelay: `${i * 0.05}s`,
                            } as React.CSSProperties}
                        >
                            <img src={CARD_BACK_URL} className="w-full h-full object-cover rounded-xl opacity-90" alt="" />
                            
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 animate-pulse"></div>
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-col items-center gap-2">
                <p className="text-xl font-serif text-yellow-100 tracking-widest flex items-center gap-3 animate-pulse">
                    <RefreshCw className="w-5 h-5 animate-spin" /> 
                    <span>正在洗牌...</span>
                </p>
                <p className="text-xs text-indigo-300/60 font-serif tracking-[0.2em]">
                    命运的红线正在交织
                </p>
            </div>
        </div>
    );
};

export default ShufflingStage;
