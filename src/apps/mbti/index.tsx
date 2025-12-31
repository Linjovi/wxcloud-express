import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Copy, Check, Sparkles, MessageCircle, BrainCircuit, Settings2, X, RotateCcw, ArrowDown } from 'lucide-react';
import { analyzeIncomingMessage, generateReplySuggestions } from './api';
import { MBTIType, MessageAnalysis, ReplySuggestion } from './types';
import { MBTI_LIST, getMBTIAvatar, getMBTIColor, getRelationshipLabel } from './constants';
import { Link } from 'react-router-dom';

const MeowBTIApp: React.FC = () => {
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [targetMBTI, setTargetMBTI] = useState<MBTIType>('INFJ');
  const [relationshipIndex, setRelationshipIndex] = useState(50);
  const [showSettings, setShowSettings] = useState(false);

  const [receivedMessage, setReceivedMessage] = useState('我感觉最近压力有点大...');
  const [analysis, setAnalysis] = useState<MessageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [myIntent, setMyIntent] = useState('表示关心，问问具体怎么了。');
  const [suggestions, setSuggestions] = useState<ReplySuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleReset = () => {
    setAnalysis(null);
    setSuggestions([]);
    setReceivedMessage('');
    setMyIntent('');
    showToast("画布已清空喵");
  };

  const handleParse = async () => {
    if (!receivedMessage.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeIncomingMessage(receivedMessage, targetMBTI, relationshipIndex);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      showToast("解析异常喵");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!myIntent.trim() || !receivedMessage.trim()) {
      showToast("信息不全喵");
      return;
    }
    setIsGeneratingSuggestions(true);
    try {
      const results = await generateReplySuggestions(receivedMessage, myIntent, targetMBTI, relationshipIndex);
      setSuggestions(results);
      
      // Scroll to suggestions
      setTimeout(() => {
        suggestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      showToast("生成失败喵");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const mbtiColor = getMBTIColor(targetMBTI);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-[#FAF9FF] text-slate-800 pb-20 relative overflow-x-hidden font-sans">
      {/* Dynamic Header color based on MBTI group */}
      <header 
        className="h-16 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm transition-colors duration-500"
        style={{ backgroundColor: mbtiColor }}
      >
        <Link to="/" className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </Link>
        <h1 className="text-lg font-black text-white tracking-widest uppercase">MeowBTI {targetMBTI}</h1>
        <button onClick={handleReset} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
          <RotateCcw size={22} />
        </button>
      </header>

      <main className="p-4 space-y-6 relative z-10">
        {/* Profile Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-start gap-5 border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BrainCircuit size={120} />
          </div>
          
          <div className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg border-4 border-white z-10">
            <img 
              src={getMBTIAvatar(targetMBTI)} 
              alt={targetMBTI} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-1 pt-1 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter" style={{ color: mbtiColor }}>
                  {targetMBTI}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {getRelationshipLabel(relationshipIndex)}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                  <span className="text-[11px] font-black text-slate-400">LV.{relationshipIndex}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-white px-4 py-2 rounded-2xl transition-all shadow-md active:scale-95 hover:shadow-lg"
              style={{ backgroundColor: mbtiColor }}
            >
              <Settings2 size={12} /> 修改设定
            </button>
          </div>
        </div>

        {/* Action: TA's Message */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-4 border border-slate-50 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: mbtiColor }}>
                 <MessageCircle size={18} />
              </div>
              <h3 className="font-black text-slate-700 text-sm">Step 1: TA 的消息</h3>
            </div>
          </div>
          
          <textarea
            className="w-full min-h-[100px] bg-slate-50 border-2 border-transparent rounded-3xl p-4 text-sm focus:outline-none focus:border-slate-200 focus:bg-white transition-all resize-none font-medium placeholder:text-slate-300"
            placeholder="TA 说了什么喵？"
            value={receivedMessage}
            onChange={(e) => setReceivedMessage(e.target.value)}
          />
          
          <div className="flex justify-end">
            <button
              onClick={handleParse}
              disabled={isAnalyzing || !receivedMessage.trim()}
              className="px-6 py-2.5 text-white rounded-2xl flex items-center gap-2 font-black disabled:opacity-40 transition-all shadow-md active:scale-95 hover:shadow-lg"
              style={{ backgroundColor: mbtiColor }}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <BrainCircuit size={16} />
                  <span>深度解析</span>
                </>
              )}
            </button>
          </div>

          {analysis && (
            <div className="bg-slate-50/80 rounded-3xl p-5 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500 relative">
               <div className="absolute -top-2 left-8 w-4 h-4 bg-slate-50 border-t border-l border-slate-100 transform rotate-45"></div>
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit size={16} style={{ color: mbtiColor }} />
                <h4 className="font-black text-slate-700 text-xs uppercase tracking-wider">潜台词透视</h4>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">{analysis.mbtiLogic}</p>
            </div>
          )}
        </div>

        {/* Connector */}
        <div className="flex justify-center -my-2 opacity-20">
          <ArrowDown size={24} style={{ color: mbtiColor }} />
        </div>

        {/* Action: My Intent */}
        <div className={`bg-white rounded-[32px] p-6 shadow-sm space-y-4 border border-slate-50 transition-all hover:shadow-md ${!analysis ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: mbtiColor }}>
                <Sparkles size={18} />
             </div>
             <h3 className="font-black text-slate-700 text-sm">Step 2: 回复意向</h3>
          </div>
          
          <textarea
            className="w-full min-h-[100px] bg-slate-50 border-2 border-transparent rounded-3xl p-4 text-sm focus:outline-none focus:border-slate-200 focus:bg-white transition-all resize-none font-medium placeholder:text-slate-300"
            placeholder="你想表达什么喵？"
            value={myIntent}
            onChange={(e) => setMyIntent(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              onClick={handleGenerateReply}
              disabled={isGeneratingSuggestions || !myIntent.trim()}
              className="px-6 py-2.5 text-white rounded-2xl flex items-center gap-2 font-black disabled:opacity-40 transition-all shadow-md active:scale-95 hover:shadow-lg"
              style={{ backgroundColor: mbtiColor }}
            >
              {isGeneratingSuggestions ? (
                <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>生成神回复</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div ref={suggestionsRef} className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center justify-center gap-2 opacity-50 mb-2">
               <div className="h-[1px] w-10 bg-slate-300"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategies Generated</span>
               <div className="h-[1px] w-10 bg-slate-300"></div>
             </div>
             
            <div className="overflow-x-auto pb-10 -mx-4 px-4 flex gap-6 snap-x scrollbar-hide">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="min-w-[320px] bg-white rounded-[40px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border-t-[12px] space-y-6 snap-center relative transition-all hover:translate-y-[-4px]" style={{ borderTopColor: mbtiColor }}>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">直觉反应</p>
                      <p className="text-[11px] text-slate-400 font-bold italic line-through opacity-60">"{suggestion.reactionToOriginal}"</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: mbtiColor }}>降维打击方案</p>
                      <div className="p-6 rounded-[32px] text-[15px] font-black leading-relaxed shadow-inner" style={{ backgroundColor: `${mbtiColor}15`, color: mbtiColor }}>
                        {suggestion.optimizedReply}
                      </div>
                      <p className="text-[11px] text-emerald-500 font-black px-1">✓ {suggestion.reactionToOptimized}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-[12px] text-slate-500 leading-relaxed font-medium">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">底层博弈逻辑</p>
                    {suggestion.briefAnalysis}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider">好感度变化</p>
                      <p className="text-lg font-black text-slate-700">
                        {suggestion.scoreChange.from} → <span style={{ color: mbtiColor }}>{suggestion.scoreChange.to}</span>
                        <span className="text-emerald-500 text-xs ml-2 font-black">+{suggestion.scoreChange.diff}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(suggestion.optimizedReply);
                        setCopiedIndex(index);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      className="text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all hover:shadow-xl"
                      style={{ backgroundColor: mbtiColor }}
                    >
                      {copiedIndex === index ? <Check size={18} /> : <Copy size={18} />}
                      {copiedIndex === index ? '已复制' : '复制'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal - No Nav Style */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-t-[48px] shadow-2xl p-10 space-y-10 animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">人格设定</h2>
              <button onClick={() => setShowSettings(false)} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* MBTI Selection Grid */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">目标人格 (MBTI)</label>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {MBTI_LIST.map(mbti => {
                  const isActive = targetMBTI === mbti;
                  const color = getMBTIColor(mbti);
                  return (
                    <button
                      key={mbti}
                      onClick={() => setTargetMBTI(mbti)}
                      className={`py-3 text-xs font-black rounded-2xl border-2 transition-all active:scale-90 ${isActive ? 'text-white shadow-xl scale-110 z-10' : 'bg-white border-slate-50 text-slate-300 hover:border-slate-100'}`}
                      style={{ 
                        backgroundColor: isActive ? color : undefined,
                        borderColor: isActive ? color : undefined
                      }}
                    >
                      {mbti}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Relationship Index Slider */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">亲密度指数 ({relationshipIndex})</label>
                <span className="text-[10px] font-black text-white px-3 py-1 rounded-full uppercase tracking-tighter" style={{ backgroundColor: mbtiColor }}>
                  {getRelationshipLabel(relationshipIndex)}
                </span>
              </div>
              <div className="relative pt-2">
                 <input 
                  type="range" min="0" max="100" 
                  value={relationshipIndex}
                  onChange={(e) => setRelationshipIndex(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer outline-none"
                  style={{ accentColor: mbtiColor }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-300 px-1 uppercase tracking-widest">
                <span>Stranger</span>
                <span>Friend</span>
                <span>Lover</span>
              </div>
            </div>

            <button 
              onClick={() => { setShowSettings(false); showToast("配置已生效"); }}
              className="w-full text-white py-5 rounded-[32px] font-black text-lg shadow-xl transition-all active:scale-95"
              style={{ backgroundColor: mbtiColor }}
            >
              完成修改
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-8 py-3 rounded-full text-xs font-black tracking-[0.2em] z-50 animate-in fade-in zoom-in duration-300 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
};

export default MeowBTIApp;
