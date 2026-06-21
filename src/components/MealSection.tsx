import React, { useState } from "react";
import { Coffee, Utensils, Moon, Candy, Plus, Trash2, ChevronDown, ChevronUp, Search, Sparkles } from "lucide-react";
import { FoodItem, MealType } from "../types";
import { QUICK_ADD_FOODS } from "../utils/nutrition";

interface MealSectionProps {
  mealType: MealType;
  title: string;
  items: FoodItem[];
  idPrefix: string;
  onRemoveItem: (id: string, mealType: MealType) => void;
  onAddItem: (item: Omit<FoodItem, "id">, mealType: MealType) => void;
}

export default function MealSection({ mealType, title, items, idPrefix, onRemoveItem, onAddItem }: MealSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Quick Search & Manual Entry States
  const [searchTerm, setSearchTerm] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualProt, setManualProt] = useState("");
  const [manualCarb, setManualCarb] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualPortion, setManualPortion] = useState("1 Porsiyon");

  // Sums
  const mealCalories = items.reduce((acc, curr) => acc + curr.calories, 0);
  const mealProtein = items.reduce((acc, curr) => acc + curr.protein, 0);
  const mealCarbs = items.reduce((acc, curr) => acc + curr.carbs, 0);
  const mealFat = items.reduce((acc, curr) => acc + curr.fat, 0);

  const getMealIcon = () => {
    switch (mealType) {
      case "breakfast": return <Coffee className="w-5 h-5 text-emerald-500" />;
      case "lunch": return <Utensils className="w-5 h-5 text-sky-500" />;
      case "dinner": return <Moon className="w-5 h-5 text-indigo-500" />;
      case "snack": return <Candy className="w-5 h-5 text-purple-500" />;
    }
  };

  const getHeaderBg = () => {
    switch (mealType) {
      case "breakfast": return "bg-emerald-50/70 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30";
      case "lunch": return "bg-sky-50/70 hover:bg-sky-100/60 dark:bg-sky-950/20 dark:hover:bg-sky-900/30";
      case "dinner": return "bg-indigo-50/70 hover:bg-indigo-100/60 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30";
      case "snack": return "bg-purple-50/70 hover:bg-purple-100/60 dark:bg-purple-950/20 dark:hover:bg-purple-900/30";
    }
  };

  const handleQuickAdd = (food: typeof QUICK_ADD_FOODS[0]) => {
    onAddItem({
      name: food.name,
      portion: food.portion,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sodium: food.sodium,
      sugar: food.sugar,
    }, mealType);
    setShowQuickAdd(false);
    setSearchTerm("");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualCal) return;

    onAddItem({
      name: manualName,
      portion: manualPortion,
      calories: parseInt(manualCal) || 0,
      protein: parseFloat(manualProt) || 0,
      carbs: parseFloat(manualCarb) || 0,
      fat: parseFloat(manualFat) || 0,
      fiber: 0,
      sodium: 0,
      sugar: 0,
    }, mealType);

    // Clear Form
    setManualName("");
    setManualCal("");
    setManualProt("");
    setManualCarb("");
    setManualFat("");
    setManualPortion("1 Porsiyon");
    setShowManualForm(false);
  };

  const filteredFoods = QUICK_ADD_FOODS.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200">
      
      {/* Header Panel */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-4 cursor-pointer transition-all select-none ${getHeaderBg()}`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xs">
            {getMealIcon()}
          </div>
          <div>
            <h4 className="font-bold text-gray-950 dark:text-slate-100 tracking-tight text-sm">{title}</h4>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono mt-0.5">
              P: {mealProtein.toFixed(1)}g | K: {mealCarbs.toFixed(1)}g | Y: {mealFat.toFixed(1)}g
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200">{mealCalories} kcal</span>
          <div className="text-gray-400 dark:text-gray-500">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-gray-50 dark:border-slate-800/80 space-y-3">
          {/* Item List Header Panel Details */}
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-505 text-center py-4 italic">Henüz besin eklenmedi. Hızlı ekleyebilir veya yapay zekayı kullanabilirsiniz.</p>
          ) : (
            <div className="divide-y divide-slate-105 dark:divide-slate-800/60">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2.5 text-xs first:pt-0 last:pb-0">
                  <div className="flex-1 pr-3">
                    <p className="font-semibold text-gray-800 dark:text-slate-200">{item.name}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">{item.portion}</p>
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <p className="font-bold font-mono text-slate-800 dark:text-slate-200">{item.calories} kcal</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-405 font-mono mt-0.5">
                        P: {item.protein} | K: {item.carbs} | Y: {item.fat}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id, mealType)}
                      className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-md transition-all cursor-pointer"
                      title="Besini Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Tabs buttons */}
          {!showQuickAdd && !showManualForm && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50/50 dark:border-slate-800/80">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 text-[11px] font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <Search className="w-3 h-3" />
                <span>Hızlı Menüden Bul</span>
              </button>
              <button
                onClick={() => setShowManualForm(true)}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 text-[11px] font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <Plus className="w-3" />
                <span>Manuel Ekle</span>
              </button>
            </div>
          )}

          {/* Quick Add Selector View */}
          {showQuickAdd && (
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Popüler Türk Gıdaları</span>
                <button 
                  onClick={() => setShowQuickAdd(false)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Kapat
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Yumurta, peynir, döner, muz..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-705 dark:text-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Quick Results Drawer */}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredFoods.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-2">Eşleşen gıda bulunamadı.</p>
                ) : (
                  filteredFoods.map((food, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleQuickAdd(food)}
                      className="flex justify-between items-center p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 cursor-pointer text-[11px] transition-all"
                    >
                      <div>
                        <p className="font-bold text-slate-850 dark:text-slate-200">{food.name}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">{food.portion} ({food.category})</p>
                      </div>
                      <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{food.calories} kcal</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Manual Form Entry View */}
          {showManualForm && (
            <form onSubmit={handleManualSubmit} className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 animate-in font-sans fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Manuel Gıda Kaydı</span>
                <button 
                  type="button" 
                  onClick={() => setShowManualForm(false)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Kapat
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Besin Adı (Örn: Sütlaç)"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="col-span-2 w-full p-2 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Miktar (Örn: 1 kase)"
                    value={manualPortion}
                    onChange={(e) => setManualPortion(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Kalori (kcal)"
                    value={manualCal}
                    onChange={(e) => setManualCal(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Macros line optional inputs */}
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Prot (g)"
                    value={manualProt}
                    onChange={(e) => setManualProt(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-gray-850 dark:text-slate-202 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Karb (g)"
                    value={manualCarb}
                    onChange={(e) => setManualCarb(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-gray-850 dark:text-slate-202 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Yağ (g)"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-gray-850 dark:text-slate-202 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 dark:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl text-center shadow-md cursor-pointer hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all font-sans"
                >
                  Öğüne Manuel Ekle
                </button>
              </div>
            </form>
          )}

        </div>
      )}
    </div>
  );
}
