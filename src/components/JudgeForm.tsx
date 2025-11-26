
import React, { useState } from 'react';
import { ConflictData, JudgeStyle } from '../types';
import { CatJudgeAvatar } from './Icons';

interface JudgeFormProps {
  onSubmit: (data: ConflictData) => void;
}

export const JudgeForm: React.FC<JudgeFormProps> = ({ onSubmit }) => {
  const [judgeStyle, setJudgeStyle] = useState<JudgeStyle>('sassy');
  const [formData, setFormData] = useState<Omit<ConflictData, 'judgeStyle'>>({
    cause: '',
    sideA: '',
    sideB: '',
    nameA: '',
    nameB: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only cause is strictly required. Names default if empty.
    if (!formData.cause) return;
    
    onSubmit({
        ...formData,
        nameA: formData.nameA || '小笨蛋A',
        nameB: formData.nameB || '大傻瓜B',
        judgeStyle
    });
  };

  const styleOptions: { id: JudgeStyle; label: string; icon: string; desc: string }[] = [
    { id: 'sassy', label: '毒舌傲娇', icon: '😼', desc: '看心情判案，怼天怼地' },
    { id: 'strict', label: '铁面无私', icon: '⚖️', desc: '包青天附体，严肃喵' },
    { id: 'greedy', label: '贪吃受贿', icon: '🐟', desc: '谁给罐罐多，谁就有理' },
  ];

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 flex flex-col items-center shadow-lg border-2 border-orange-100 mt-4 relative overflow-visible">
        <div className="-mt-16 mb-2">
             <CatJudgeAvatar className="w-28 h-28 drop-shadow-xl" />
        </div>
        <div className="text-center">
          <h2 className="font-black text-xl text-gray-800">猫猫巡回法庭</h2>
          <p className="text-xs text-orange-500 font-medium mt-1">
            "本庭宣判：坦白从宽，不给罐罐就捣乱"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Judge Selector */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800 ml-1">选择法官性格</label>
            <div className="grid grid-cols-3 gap-2">
                {styleOptions.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => setJudgeStyle(option.id)}
                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                            judgeStyle === option.id 
                            ? 'bg-orange-50 border-orange-400 shadow-md transform scale-105 z-10' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200'
                        }`}
                    >
                        <span className="text-2xl mb-1">{option.icon}</span>
                        <span className={`text-xs font-bold ${judgeStyle === option.id ? 'text-orange-600' : ''}`}>
                            {option.label}
                        </span>
                        {judgeStyle === option.id && (
                             <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full shadow-sm">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             </div>
                        )}
                    </button>
                ))}
            </div>
            <p className="text-xs text-center text-gray-400 h-4">
                {styleOptions.find(s => s.id === judgeStyle)?.desc}
            </p>
        </div>

        {/* Cause Section (Required) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-50">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
            <span className="text-lg">📜</span> 
            案发经过 (必填)
          </label>
          <textarea
            className="w-full bg-gray-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400"
            rows={3}
            placeholder="请详细描述矛盾的起因..."
            value={formData.cause}
            onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
            required
          />
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-2 gap-4">
             {/* Player A */}
             <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex flex-col">
                <div className="mb-2">
                    <label className="text-xs font-bold text-blue-800 block mb-1 ml-1">当事人 A</label>
                    <input 
                        type="text"
                        placeholder="昵称 (如: 没头脑)"
                        className="w-full bg-white rounded-lg border-0 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-200 mb-2"
                        value={formData.nameA}
                        onChange={(e) => setFormData({...formData, nameA: e.target.value})}
                    />
                </div>
                <div className="flex-1">
                    <textarea 
                        rows={3}
                        placeholder="A 的理由..."
                        className="w-full h-full bg-white/50 rounded-lg border-0 p-3 text-xs focus:ring-2 focus:ring-blue-200 resize-none"
                        value={formData.sideA}
                        onChange={(e) => setFormData({...formData, sideA: e.target.value})}
                    />
                </div>
             </div>

             {/* Player B */}
             <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100 flex flex-col">
                <div className="mb-2">
                    <label className="text-xs font-bold text-red-800 block mb-1 ml-1">当事人 B</label>
                    <input 
                        type="text"
                        placeholder="昵称 (如: 不高兴)"
                        className="w-full bg-white rounded-lg border-0 py-2 px-3 text-sm focus:ring-2 focus:ring-red-200 mb-2"
                        value={formData.nameB}
                        onChange={(e) => setFormData({...formData, nameB: e.target.value})}
                    />
                </div>
                <div className="flex-1">
                    <textarea 
                        rows={3}
                        placeholder="B 的理由..."
                        className="w-full h-full bg-white/50 rounded-lg border-0 p-3 text-xs focus:ring-2 focus:ring-red-200 resize-none"
                        value={formData.sideB}
                        onChange={(e) => setFormData({...formData, sideB: e.target.value})}
                    />
                </div>
             </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-400 to-red-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200/50 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <span className="text-xl">🐾</span>
            <span>升堂！请求裁决！</span>
            <span className="text-xl">🐾</span>
          </button>
        </div>

      </form>
    </div>
  );
};
