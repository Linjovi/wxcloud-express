import React, { useRef, useEffect } from 'react';
import { DrawnCard, TarotReadingResult } from '../../types';
import Card from '../Card';
import Button from '../Button';
import { Star, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReadingStageProps {
    drawnCards: DrawnCard[];
    reading: TarotReadingResult | null;
    loading: boolean;
    loadingMsg: string;
    question: string;
    avatarUrl: string;
    onReveal: (index: number) => void;
    onReset: () => void;
}

const ReadingStage: React.FC<ReadingStageProps> = ({
    drawnCards,
    reading,
    loading,
    loadingMsg,
    question,
    avatarUrl,
    onReveal,
    onReset
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (loading) {
            // Scroll to bottom to show loading
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [loading]);

    useEffect(() => {
        if (reading && !loading) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [reading, loading]);

    return (
        <div className="w-full flex flex-col items-center gap-8 pb-20 animate-fade-in">

            <div className="flex flex-wrap gap-8 justify-center w-full mt-4">
                {drawnCards.map((card, index) => (
                    <div key={card.id} className="flex flex-col items-center gap-4 group">
                        <span className="text-yellow-500 font-serif text-sm tracking-[0.2em] border-b border-yellow-500/30 pb-1 max-w-[150px] text-center truncate">
                            {card.position}
                        </span>

                        <div className="relative">
                            <Card
                                card={card}
                                isRevealed={card.isRevealed}
                                onClick={() => onReveal(index)}
                                width="w-32 md:w-48"
                                className="shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                            />
                            {card.isRevealed && (
                                <div className="absolute inset-0 bg-yellow-400/10 blur-xl -z-10 rounded-full animate-pulse"></div>
                            )}
                        </div>
                        <div className={`text-center transition-all duration-700 transform ${card.isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                            <h3 className="font-bold text-white text-lg font-serif">{card.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded border ${card.isReversed ? 'border-red-400 text-red-300' : 'border-emerald-400 text-emerald-300'} font-mono uppercase bg-black/40`}>
                                {card.isReversed ? '逆位' : '正位'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Prompt to reveal */}
            {!drawnCards.every(c => c.isRevealed) && (
                <div className="mt-8 animate-bounce text-indigo-300 font-serif tracking-widest flex items-center gap-2">
                    <Star className="w-4 h-4" /> 点击卡牌揭示命运喵 <Star className="w-4 h-4" />
                </div>
            )}

            {/* Loading AI */}
            {loading && (
                <div className="flex flex-col items-center gap-4 mt-12 animate-fade-in py-8" ref={scrollRef}>
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-500/50 relative z-10 animate-pulse">
                            <img src={avatarUrl} className="w-full h-full object-cover" alt="Loading" />
                        </div>
                        <Loader2 className="w-32 h-32 text-yellow-500 animate-spin absolute -top-4 -left-4 opacity-50" />
                        <div className="absolute inset-0 blur-lg bg-yellow-500/30 animate-pulse"></div>
                    </div>
                    <p className="text-purple-200 font-serif text-lg tracking-widest mt-4">{loadingMsg}</p>
                </div>
            )}

            {/* Result */}
            {reading && !loading && (
                <div ref={resultRef} className="w-full max-w-5xl relative mt-12 group perspective-1000 animate-fade-in-up">

                    <div className="relative bg-[#1a1638]/90 backdrop-blur-md border border-yellow-500/20 rounded-xl p-2 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col gap-4">
                        {/* Decorative corners */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-yellow-500/30 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-yellow-500/30 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-yellow-500/30 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-yellow-500/30 rounded-br-xl"></div>

                        {question && (
                            <div className="text-center border-b border-white/10 pb-6">
                                <h3 className="text-xs md:text-sm uppercase tracking-widest text-indigo-400 mb-2">你的问题</h3>
                                <p className="text-xl md:text-2xl text-yellow-100 font-serif italic">"{question}"</p>
                            </div>
                        )}

                        {/* Intro */}
                        <div className="prose prose-invert prose-yellow max-w-none font-serif text-lg text-center leading-relaxed text-indigo-100">
                            <ReactMarkdown>{reading.intro}</ReactMarkdown>
                        </div>

                        {/* Cards Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {reading.cards.map((cardAnalysis, idx) => {
                                const originalCard = drawnCards[idx];
                                return (
                                    <div key={idx} className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-6 hover:bg-indigo-900/40 transition-colors flex flex-col gap-4">
                                        <div className="flex items-center gap-4 border-b border-indigo-500/20">
                                            <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
                                                {originalCard && (
                                                    <img 
                                                        src={originalCard.imageUrl} 
                                                        className={`w-full h-full object-cover ${originalCard.isReversed ? 'transform rotate-180' : ''}`} 
                                                        alt={cardAnalysis.cardName}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-indigo-400 uppercase tracking-widest mb-1">{cardAnalysis.position}</span>
                                                <h4 className="text-yellow-200 font-serif font-bold text-lg">{cardAnalysis.cardName}</h4>
                                            </div>
                                        </div>
                                        <div className="text-gray-300 text-sm leading-relaxed font-serif text-justify flex-grow">
                                            <ReactMarkdown>{cardAnalysis.interpretation}</ReactMarkdown>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Conclusion */}
                        <div className="mt-6 bg-gradient-to-r from-indigo-950/30 via-indigo-900/50 to-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 text-center relative overflow-hidden">
                             <div className="absolute inset-0 bg-yellow-500/5 blur-3xl -z-10"></div>
                            <h3 className="text-yellow-400 font-serif text-lg mb-4 flex items-center justify-center gap-2">
                                <Star className="w-4 h-4 fill-yellow-400" /> 命运指引 <Star className="w-4 h-4 fill-yellow-400" />
                            </h3>
                            <div className="prose prose-invert prose-yellow max-w-none font-serif text-lg">
                                <ReactMarkdown>{reading.conclusion}</ReactMarkdown>
                            </div>
                        </div>

                    </div>

                    <div className="mt-12 flex justify-center pb-8">
                        <Button onClick={onReset} variant="secondary">
                            <span className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> 重新占卜喵
                            </span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReadingStage;
