import { useState, useEffect } from "react";
import { X, Target, Save, HelpCircle, Activity } from "lucide-react";
import { DailyTargets } from "../types";
import { calculateDefaultMacros } from "../utils/nutrition";

interface TargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargets: DailyTargets;
  onUpdateTargets: (newTargets: DailyTargets) => void;
}

export default function TargetsModal({ isOpen, onClose, currentTargets, onUpdateTargets }: TargetsModalProps) {
  const [calories, setCalories] = useState(currentTargets.calories);
  const [protein, setProtein] = useState(currentTargets.protein);
  const [carbs, setCarbs] = useState(currentTargets.carbs);
  const [fat, setFat] = useState(currentTargets.fat);
  const [water, setWater] = useState(currentTargets.water);
  const [fiber, setFiber] = useState(currentTargets.fiber);
  const [sodium, setSodium] = useState(currentTargets.sodium);
  const [sugarLimit, setSugarLimit] = useState(currentTargets.sugarLimit);

  // Sync state if currents change
  useEffect(() => {
    setCalories(currentTargets.calories);
    setProtein(currentTargets.protein);
    setCarbs(currentTargets.carbs);
    setFat(currentTargets.fat);
    setWater(currentTargets.water);
    setFiber(currentTargets.fiber);
    setSodium(currentTargets.sodium);
    setSugarLimit(currentTargets.sugarLimit);
  }, [currentTargets]);

  if (!isOpen) return null;

  // Derive macro percentages
  // 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
  const proteinKcal = protein * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  const proteinPct = totalMacroKcal > 0 ? Math.round((proteinKcal / totalMacroKcal) * 100) : 0;
  const carbsPct = totalMacroKcal > 0 ? Math.round((carbsKcal / totalMacroKcal) * 100) : 0;
  const fatPct = totalMacroKcal > 0 ? Math.round((fatKcal / totalMacroKcal) * 100) : 0;
  const totalPct = proteinPct + carbsPct + fatPct;

  const applyDiyetisyenRatios = () => {
    const defaults = calculateDefaultMacros(calories);
    setProtein(defaults.protein);
    setCarbs(defaults.carbs);
    setFat(defaults.fat);
    setFiber(defaults.fiber);
    setSodium(defaults.sodium);
    setSugarLimit(defaults.sugarLimit);
  };

  const handleSave = () => {
    onUpdateTargets({
      calories,
      protein,
      carbs,
      fat,
      water,
      fiber,
      sodium,
      sugarLimit,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Contents */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 shadow-2xl relative z-10 animate-in scale-in-95 duration-200 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-amber-500 rounded-xl text-white">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 tracking-tight">Kişiselleştirilmiş Hedef Ayarları</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">Günlük kalori ve makro oranlarınızı dilediğiniz gibi ayarlayın.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="p-6 space-y-5 max-h-[450px] overflow-y-auto">

          {/* Primary Calorie Input */}
          <div className="bg-amber-50/50 dark:bg-amber-955/10 p-4 rounded-2xl border border-amber-100/60 dark:border-amber-900/30">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Günlük Kalori Hedefi (kcal)</label>
              <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md font-semibold font-mono">Enerji</span>
            </div>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Math.max(500, parseInt(e.target.value) || 0))}
              className="w-full text-2xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-center font-mono"
            />
            <button
              type="button"
              onClick={applyDiyetisyenRatios}
              className="mt-3 w-full bg-white dark:bg-slate-950 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-semibold py-2 px-3 border border-amber-200 dark:border-amber-900/40 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
            >
              <Activity className="w-4 h-4 text-amber-500" />
              <span>Diyetisyen Makro Dağılımını Öner (~45% K, ~30% P, ~25% Y)</span>
            </button>
          </div>

          {/* Calorie Proportion Analysis Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider font-sans">Aktif Kalori Oranları ({totalPct}%)</span>
              <span className={`font-mono font-medium ${totalPct !== 100 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {totalPct !== 100 ? "Öneri: %100'e eşitleyin" : "Mükemmel Dengede"}
              </span>
            </div>
            <div className="h-2 rounded-full flex overflow-hidden bg-gray-100 dark:bg-slate-950">
              <div style={{ width: `${carbsPct}%` }} className="bg-sky-400 transition-all" title={`Karb: %${carbsPct}`} />
              <div style={{ width: `${proteinPct}%` }} className="bg-emerald-400 transition-all" title={`Protein: %${proteinPct}`} />
              <div style={{ width: `${fatPct}%` }} className="bg-amber-400 transition-all" title={`Yağ: %${fatPct}`} />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono font-medium text-gray-600 dark:text-slate-400 gap-1 px-1">
              <span className="text-sky-500 dark:text-sky-400 font-semibold">Karbonhidrat: %{carbsPct} ({carbs * 4} kcal)</span>
              <span className="text-emerald-500 dark:text-emerald-450 font-semibold">Protein: %{proteinPct} ({protein * 4} kcal)</span>
              <span className="text-amber-500 dark:text-amber-450 font-semibold">Yağ: %{fatPct} ({fat * 9} kcal)</span>
            </div>
          </div>

          {/* Macro Split Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Karb (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-center text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-center text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1 font-mono">Yağ (g)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-center text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Secondary & Water Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Günlük Su (ml)</label>
              <input
                type="number"
                step="250"
                value={water}
                onChange={(e) => setWater(Math.max(500, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 font-mono">Diyet Lifi (g)</label>
              <input
                type="number"
                value={fiber}
                onChange={(e) => setFiber(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Sodyum Limiti (mg)</label>
              <input
                type="number"
                step="100"
                value={sodium}
                onChange={(e) => setSodium(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 font-mono">Şeker Limiti (g)</label>
              <input
                type="number"
                value={sugarLimit}
                onChange={(e) => setSugarLimit(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex space-x-3 transition-colors">
          <button
            onClick={onClose}
            className="flex-1 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold py-3 border border-gray-200 dark:border-slate-800 rounded-2xl transition-all cursor-pointer text-center"
          >
            İptal Et
          </button>
          <button
            onClick={handleSave}
            className="flex-2 bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white text-sm font-bold py-3 rounded-2xl flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Hedefleri Güncelle</span>
          </button>
        </div>

      </div>
    </div>
  );
}
