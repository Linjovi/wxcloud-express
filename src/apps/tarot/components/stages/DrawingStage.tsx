import React, { useRef, useState, useEffect } from 'react';
import { TarotCard, DrawnCard, SpreadConfig } from '../../types';
import { CARD_BACK_URL } from '../../constants';
import Card from '../Card';

interface DrawingStageProps {
    deck: TarotCard[];
    drawnCards: DrawnCard[];
    drawnIndices: number[];
    selectedSpread: SpreadConfig;
    animatingCard: { index: number, startX: number, startY: number } | null;
    grabbedIndex: number | null;
    pawState: {
        visible: boolean;
        targetX: number;
        targetY: number;
        phase: 'idle' | 'reaching' | 'grabbing' | 'retracting';
    };
    onDrawCard: (index: number, e: React.MouseEvent) => void;
}

const DrawingStage: React.FC<DrawingStageProps> = ({
    deck,
    drawnCards,
    drawnIndices,
    selectedSpread,
    animatingCard,
    grabbedIndex,
    pawState,
    onDrawCard,
}) => {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });
    const startOffsetRef = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate content boundaries based on actual card positions
    const bounds = React.useMemo(() => {
        if (deck.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        deck.forEach((card: any) => {
            const x = card.scatterX || 0;
            const y = card.scatterY || 0;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        });

        // Add padding (card size + extra)
        const padding = 100; // Padding around the extreme cards
        return {
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding
        };
    }, [deck]);

    const handleStart = (clientX: number, clientY: number) => {
        isDraggingRef.current = true;
        startPosRef.current = { x: clientX, y: clientY };
        startOffsetRef.current = { ...offset };
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isDraggingRef.current || !containerRef.current) return;

        const deltaX = clientX - startPosRef.current.x;
        const deltaY = clientY - startPosRef.current.y;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const targetX = startOffsetRef.current.x + deltaX;
        const targetY = startOffsetRef.current.y + deltaY;

        // The content container is centered (left: 1/2, top: 1/2).
        // Its transform moves its origin.
        // The visible area is the containerRef's clientWidth/Height.
        // We want to ensure that the content (defined by bounds) stays within the viewport.

        // Max offset (move content right): The left edge of the content (bounds.minX)
        // should not go past the LEFT edge of the viewport (relative to content origin).
        // Viewport left edge relative to content origin: -containerWidth / 2
        // So, offset.x + bounds.minX <= -containerWidth / 2
        // offset.x <= -containerWidth / 2 - bounds.minX
        let maxOffsetX = -containerWidth / 2 - bounds.minX;

        // Min offset (move content left): The right edge of the content (bounds.maxX)
        // should not go past the RIGHT edge of the viewport (relative to content origin).
        // Viewport right edge relative to content origin: containerWidth / 2
        // So, offset.x + bounds.maxX >= containerWidth / 2
        // offset.x >= containerWidth / 2 - bounds.maxX
        let minOffsetX = containerWidth / 2 - bounds.maxX;

        // If content is smaller than viewport, center it (lock to 0 or clamp to center range)
        if (minOffsetX > maxOffsetX) {
            minOffsetX = maxOffsetX = 0;
        }

        // Same logic for Y
        let maxOffsetY = -containerHeight / 2 - bounds.minY;
        let minOffsetY = containerHeight / 2 - bounds.maxY;

        if (minOffsetY > maxOffsetY) {
            minOffsetY = maxOffsetY = 0;
        }

        const clampedX = Math.min(maxOffsetX, Math.max(minOffsetX, targetX));
        const clampedY = Math.min(maxOffsetY, Math.max(minOffsetY, targetY));

        setOffset({ x: clampedX, y: clampedY });
    };

    const handleEnd = () => {
        isDraggingRef.current = false;
    };

    // Mouse events
    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => handleEnd();

    // Touch events
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    return (
        <div className="w-full text-center flex flex-col flex-1 min-h-0 py-4 relative overflow-hidden">
            <h2 className="text-2xl font-serif text-yellow-100 mb-2 animate-fade-in z-20 relative shrink-0">
                请凭直觉抽取 {selectedSpread.cards - drawnCards.length} 张牌喵
            </h2>

            {/* Dynamic Drawn Slots - Smaller and pinned to top */}
            <div className={`flex justify-center flex-wrap gap-2 mb-4 z-20 relative shrink-0 transition-all duration-500`}>
                {Array.from({ length: selectedSpread.cards }).map((_, i) => {
                    const card = drawnCards[i];
                    const label = selectedSpread.positions[i]?.name || `位置 ${i + 1}`;

                    return (
                        <div key={i} className="flex flex-col items-center gap-1 transition-all duration-500">
                            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-serif max-w-[60px] truncate">{label}</span>
                            <div className="relative w-16 h-24 rounded border border-dashed border-indigo-500/30 flex items-center justify-center bg-indigo-900/10 transition-all duration-500">
                                {card ? (
                                    <div className="absolute inset-0 animate-land-card">
                                        <Card
                                            card={card}
                                            isRevealed={false} // Always face down initially
                                            width="w-full h-full"
                                            className="shadow-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500/30"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* The "Table" Surface */}
            <div
                ref={containerRef}
                className="flex-1 w-full relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Table Background texture hint */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>
                <div className="absolute top-2 left-0 w-full text-center text-xs text-indigo-300/30 pointer-events-none z-10">
                    &lt;&lt; 拖动桌面寻找卡牌 &gt;&gt;
                </div>

                <div
                    className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center transition-transform duration-100 ease-out"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px)`,
                    }}
                >
                    {deck.map((card: any, i) => {
                        const isAnimating = animatingCard?.index === i;
                        const isDrawn = drawnIndices.includes(i);
                        const isGrabbed = grabbedIndex === i;

                        // Randomize scatter slightly
                        const rot = card.scatterRotation || 0;
                        const x = card.scatterX || 0;
                        const y = card.scatterY || 0;

                        return (
                            <div
                                key={i}
                                onClick={(e) => !isAnimating && !isDrawn && !isGrabbed && onDrawCard(i, e)}
                                className={`absolute w-20 h-32 origin-center
                                    ease-out border border-white/10 rounded-lg shadow-lg bg-indigo-950
                                    ${isAnimating || isGrabbed ? 'opacity-0 pointer-events-none' : ''}
                                    ${isDrawn ? 'invisible pointer-events-none' : 'cursor-pointer opacity-100 hover:-translate-y-2 z-10 hover:z-50 hover:shadow-yellow-500/20'}
                                `}
                                style={{
                                    transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                                    // Center the card on its coordinates
                                    marginLeft: '-40px',
                                    marginTop: '-64px'
                                }}
                            >
                                <img src={CARD_BACK_URL} className="w-full h-full object-cover rounded-lg" alt="" />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Flying Card Animation Element */}
            {animatingCard && (
                <div
                    className="fixed w-20 h-32 z-[100] rounded-lg shadow-2xl pointer-events-none"
                    style={{
                        left: animatingCard.startX,
                        top: animatingCard.startY,
                        transform: 'translate(-50%, -50%)',
                        animation: 'flyToSlot 0.6s ease-in-out forwards'
                    }}
                >
                    <img src={CARD_BACK_URL} className="w-full h-full object-cover rounded-lg" alt="" />
                </div>
            )}

            {/* Cat Paw Element */}
            <div
                className={`cat-paw-container ${pawState.visible ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    left: pawState.targetX,
                    top: pawState.targetY,
                    transform: pawState.phase === 'reaching' || pawState.phase === 'grabbing'
                        ? 'translate(-50%, -50%)'
                        : 'translate(60vw, 60vh)' // Move far away to bottom-right
                }}
            >
                <div className={`cat-paw ${pawState.phase === 'grabbing' ? 'scale-95' : ''} transition-transform duration-200`}>
                    <div className="cat-paw-shadow"></div>
                    <div className="paw-fur"></div>
                    <div className="paw-pad-main"></div>
                    <div className="paw-toe"></div>
                    <div className="paw-toe"></div>
                    <div className="paw-toe"></div>
                    <div className="paw-toe"></div>
                </div>
            </div>
        </div>
    );
};

export default DrawingStage;
