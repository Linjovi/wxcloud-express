import React, { useState, useEffect, useRef } from 'react';
import { getDeck, SPREAD_CONFIGS } from './constants';
import { TarotCard, DrawnCard, GameStage, SpreadConfig, TarotReadingResult } from './types';
import { getTarotReading } from './services/geminiService';
import { ChevronLeft } from 'lucide-react';
import './index.scss';

// Import Stage Components
import IntroStage from './components/stages/IntroStage';
import InputQuestionStage from './components/stages/InputQuestionStage';
import SpreadSelectionStage from './components/stages/SpreadSelectionStage';
import ShufflingStage from './components/stages/ShufflingStage';
import CuttingStage from './components/stages/CuttingStage';
import DrawingStage from './components/stages/DrawingStage';
import ReadingStage from './components/stages/ReadingStage';

// Loading messages
const LOADING_MESSAGES = [
  "喵~ 正在链接灵性位面...",
  "喵呜... 正在解读星辰的轨迹...",
  "嘘... 正在聆听牌灵的低语喵...",
  "命运的齿轮正在转动喵...",
  "正在汇聚宇宙的能量喵..."
];

const TAROT_CAT_AVATAR = "https://pic1.imgdb.cn/item/693811d900233646958db503.png";

interface AppProps {
  onBack: () => void;
}

// Helper to get a scattered deck
const getScatteredDeck = () => {
  const initialDeck = getDeck();
  return initialDeck.map(card => ({
    ...card,
    scatterRotation: Math.random() * 360,
    scatterX: (Math.random() - 0.5) * 1000,
    scatterY: (Math.random() - 0.5) * 600,
  }));
};

const App: React.FC<AppProps> = ({ onBack }) => {
  const [stage, setStage] = useState<GameStage>('intro');
  const [selectedSpread, setSelectedSpread] = useState<SpreadConfig>(SPREAD_CONFIGS[1]); // Default to Triangle
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [drawnIndices, setDrawnIndices] = useState<number[]>([]); // Track which visual cards are gone
  const [reading, setReading] = useState<TarotReadingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [userQuestion, setUserQuestion] = useState('');

  // Animation state for "flying" card
  const [animatingCard, setAnimatingCard] = useState<{ index: number, startX: number, startY: number } | null>(null);
  const [grabbedIndex, setGrabbedIndex] = useState<number | null>(null);

  // Cat Paw Interaction State
  const [pawState, setPawState] = useState<{
    visible: boolean;
    targetX: number;
    targetY: number;
    phase: 'idle' | 'reaching' | 'grabbing' | 'retracting';
  }>({
    visible: false,
    targetX: 0,
    targetY: 0,
    phase: 'idle'
  });

  const [cutOffset, setCutOffset] = useState(0); // 0 = stacked, 1 = split
  const [isCutSwapped, setIsCutSwapped] = useState(false); // Track if decks are swapped

  // Ref to track current stage for async callbacks
  const stageRef = useRef(stage);
  // Ref to hold the pre-fetched reading promise
  const readingPromiseRef = useRef<Promise<TarotReadingResult> | null>(null);

  // Initialize deck and scatter cards
  useEffect(() => {
    setDeck(getScatteredDeck());
  }, []);

  // Update stage ref
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // Cycle loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleStartIntro = () => {
    setStage('input_question');
  };

  const handleConfirmQuestion = () => {
    setStage('spread_selection');
  };

  const handleSelectSpread = (spread: SpreadConfig) => {
    setSelectedSpread(spread);
    setStage('shuffling');
    // Simulate shuffle duration
    setTimeout(() => {
      // Check ref to ensure user hasn't navigated away
      if (stageRef.current === 'shuffling') {
        setStage('cutting');
      }
    }, 2500);
  };

  const handleCutDeck = () => {
    setCutOffset(1);
    setTimeout(() => {
      setIsCutSwapped(true); // Swap order while split
      
      // Small delay to ensure swap logic applies before merging? 
      // No, React state updates are batched or fast enough usually, 
      // but let's just set cutOffset back to 0 in the next tick or same tick.
      // Actually, setting them together is fine. The re-render will show them swapped and moving back.
      
      requestAnimationFrame(() => {
          setCutOffset(0); // Merge back
      });

      setTimeout(() => {
        setStage('drawing');
      }, 800);
    }, 1000);
  };

  const handleBack = () => {
    // Reset transient states
    setLoading(false);
    setAnimatingCard(null);
    setGrabbedIndex(null);
    setCutOffset(0);
    setIsCutSwapped(false);
    readingPromiseRef.current = null; // Cancel any pending reading
    setPawState(prev => ({ ...prev, visible: false, phase: 'idle' }));
    switch (stage) {
      case 'input_question':
        setStage('intro');
        break;
      case 'spread_selection':
        setStage('input_question');
        break;
      case 'cutting':
        setStage('spread_selection'); // Go back to re-shuffle
        break;
      case 'drawing':
        // Abort drawing, go back to spread selection to re-select
        setStage('spread_selection');
        setDrawnCards([]);
        setDrawnIndices([]);
        setDeck(getScatteredDeck());
        break;
      case 'reading':
      case 'result':
        // Abort reading, go back to spread selection
        setStage('spread_selection');
        setDrawnCards([]);
        setDrawnIndices([]);
        setReading(null);
        setDeck(getScatteredDeck()); // Reshuffle for next time
        break;
      default:
        break;
    }
  };

  const handleDrawCard = (index: number, e: React.MouseEvent) => {
    if (drawnCards.length >= selectedSpread.cards || animatingCard !== null || pawState.visible) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    // 1. Trigger Paw Reaching
    setPawState({
      visible: true,
      targetX: clientX,
      targetY: clientY,
      phase: 'reaching'
    });

    // 2. After reach animation, Grab
    setTimeout(() => {
      // debugger;
      setPawState(prev => ({ ...prev, phase: 'grabbing' }));
      setGrabbedIndex(index); // Hide the card immediately when grabbed

      // 3. Retract and start card flight
      // Immediately retract
      setPawState(prev => ({ ...prev, phase: 'retracting' }));

      // Start card animation logic
      // Logic to select card
      const selectedCardIndex = Math.floor(Math.random() * deck.length);
      const selectedCard = deck[selectedCardIndex];

      // Trigger animation
      // Use dynamic position names from the selected spread config
      const positionInfo = selectedSpread.positions[drawnCards.length];
      const newDrawnCard: DrawnCard = {
        ...selectedCard,
        position: positionInfo.name,
        isRevealed: false
      };

      // Only update if we are still drawing (user didn't click back)
      if (stageRef.current === 'drawing') {
        setDrawnCards(prev => [...prev, newDrawnCard]);
        setDrawnIndices(prev => [...prev, index]);
        setAnimatingCard(null);
      }

      // Hide paw after retracting
      setTimeout(() => {
        setPawState(prev => ({ ...prev, visible: false, phase: 'idle' }));
      }, 400); // Wait for retraction animation

    }, 300); // Reaching duration
  };

  // Auto-transition when all cards drawn
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (drawnCards.length === selectedSpread.cards && stage === 'drawing' && animatingCard === null) {
      
      // Start the API request immediately in the background
      // This optimizes the experience by pre-fetching while user flips cards later
      if (!readingPromiseRef.current) {
        readingPromiseRef.current = getTarotReading(drawnCards, selectedSpread.name, userQuestion)
            .catch(err => {
                console.error("Pre-fetch failed:", err);
                // Return a rejected promise or handle it so the subsequent await throws
                throw err;
            });
      }

      timer = setTimeout(() => {
        setStage('reading');
        setDrawnIndices([]); // Reset for next time (though we usually reshuffle)
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [drawnCards, stage, animatingCard, selectedSpread.cards, selectedSpread.name, userQuestion]);

  const handleReveal = async (index: number) => {
    if (drawnCards[index].isRevealed) return;

    const newCards = [...drawnCards];
    newCards[index].isRevealed = true;
    setDrawnCards(newCards);

    // Check if all revealed
    if (newCards.every(c => c.isRevealed) && !reading && !loading) {
      await generateInterpretation(newCards);
    }
  };

  const generateInterpretation = async (cards: DrawnCard[]) => {
    setLoading(true);

    try {
        let result: TarotReadingResult;
        
        // Check if we have a pre-fetched promise
        if (readingPromiseRef.current) {
            result = await readingPromiseRef.current;
        } else {
            // Fallback if somehow missed (shouldn't happen with current logic)
            result = await getTarotReading(cards, selectedSpread.name, userQuestion);
        }

        // Safety check: ensure we are still in the reading stage
        if (stageRef.current !== 'reading') return;

        setReading(result);
        setLoading(false);
        setStage('result');
    } catch (error) {
        console.error("Reading failed:", error);
        setLoading(false);
        // Optional: Show error state or toast
        // For now, maybe reset the promise so they can try again if we added a retry button
        readingPromiseRef.current = null;
    }
  };

  const resetGame = () => {
    setStage('intro');
    setDrawnCards([]);
    setReading(null);
    setUserQuestion('');
    setDeck(getScatteredDeck());
    readingPromiseRef.current = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-[#0f0c29] to-black text-gray-200 flex flex-col overflow-x-hidden relative font-sans">

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      {/* Header */}
      <header className="p-6 text-center z-10 animate-fade-in pt-12 md:pt-6">
        <h1 className="sr-only">塔罗秘境喵 - 在线塔罗占卜</h1>
        <p className="text-indigo-200 text-xs md:text-sm mt-3 font-light tracking-[0.2em] uppercase opacity-80">
          喵呜~ 洞悉过去 · 把握当下 · 预见未来
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-3 relative z-10 w-full max-w-4xl mx-auto min-h-[600px]">

        {stage === 'intro' && (
          <IntroStage
            onStart={handleStartIntro}
            avatarUrl={TAROT_CAT_AVATAR}
          />
        )}

        {stage === 'input_question' && (
          <InputQuestionStage
            question={userQuestion}
            setQuestion={setUserQuestion}
            onConfirm={handleConfirmQuestion}
          />
        )}

        {stage === 'spread_selection' && (
          <SpreadSelectionStage
            question={userQuestion}
            onSelect={handleSelectSpread}
          />
        )}

        {stage === 'shuffling' && (
          <ShufflingStage />
        )}

        {stage === 'cutting' && (
          <CuttingStage
            cutOffset={cutOffset}
            isSwapped={isCutSwapped}
            onCut={handleCutDeck}
          />
        )}

        {stage === 'drawing' && (
          <DrawingStage
            deck={deck}
            drawnCards={drawnCards}
            drawnIndices={drawnIndices}
            selectedSpread={selectedSpread}
            animatingCard={animatingCard}
            grabbedIndex={grabbedIndex}
            pawState={pawState}
            onDrawCard={handleDrawCard}
          />
        )}

        {(stage === 'reading' || stage === 'result') && (
          <ReadingStage
            drawnCards={drawnCards}
            reading={reading}
            loading={loading}
            loadingMsg={loadingMsg}
            question={userQuestion}
            avatarUrl={TAROT_CAT_AVATAR}
            onReveal={handleReveal}
            onReset={resetGame}
          />
        )}
      </main>

      {/* Bottom Back Button (Flow Content) */}
      {(stage === 'input_question' || stage === 'spread_selection' || stage === 'drawing') && (
        <div className="w-full flex justify-center pb-4 z-50 animate-fade-in relative">
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 rounded-full text-indigo-200 hover:text-yellow-100 hover:bg-indigo-900 flex items-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 group hover:border-yellow-500/30 text-sm"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-serif tracking-widest">返回上一步喵</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
