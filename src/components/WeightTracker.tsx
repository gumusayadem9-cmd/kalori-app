import React, { useState } from "react";
import { Scale, Plus, Trash2, TrendingDown, Target, HelpCircle, AlertCircle, Info, Calendar } from "lucide-react";

export interface WeightLog {
  date: string;
  weight: number;
}

interface WeightTrackerProps {
  weightLogs: WeightLog[];
  onAddWeightLog: (date: string, weight: number) => void;
  onDeleteWeightLog: (date: string) => void;
  currentWeight: number;
  targetWeight: number;
  height: number; // in cm
  onUpdateTargetWeight: (weight: number) => void;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({
  weightLogs,
  onAddWeightLog,
  onDeleteWeightLog,
  currentWeight,
  targetWeight,
  height,
  onUpdateTargetWeight,
}) => {
  const [newWeight, setNewWeight] = useState<string>("");
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTargetInput, setTempTargetInput] = useState(String(targetWeight));

  // Parse logs sorted by date
  const sortedLogs = [...weightLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // BMI Calculation
  const heightM = height / 100;
  const bmi = heightM > 0 ? currentWeight / (heightM * heightM) : 0;
  
  const getBmiStatus = (val: number) => {
    if (val < 18.5) return { label: "Zayıf", color: "text-amber-500 bg-amber-50 border-amber-100" };
    if (val < 25) return { label: "Sağlıklı", color: "text-emerald-500 bg-emerald-50 border-emerald-100" };
    if (val < 30) return { label: "Fazla Kilolu", color: "text-orange-500 bg-orange-50 border-orange-100" };
    return { label: "Obez", color: "text-red-500 bg-red-50 border-red-100" };
  };
  const bmiStatus = getBmiStatus(bmi);

  // Calculations for display cards
  const firstLog = sortedLogs[0];
  const totalDifference = firstLog ? currentWeight - firstLog.weight : 0;
  const targetRemaining = currentWeight - targetWeight;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 10 && w < 300) {
      onAddWeightLog(newDate, w);
      setNewWeight("");
    }
  };

  // Generate interactive SVG chart geometry
  // Width: 600, Height: 240
  const chartWidth = 600;
  const chartHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const weights = sortedLogs.map((l) => l.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights, targetWeight) - 2 : 60;
  const maxWeight = weights.length > 0 ? Math.max(...weights, targetWeight) + 2 : 90;
  const rangeWeight = maxWeight - minWeight || 10;

  const getX = (index: number) => {
    if (sortedLogs.length <= 1) return paddingX + (chartWidth - paddingX * 2) / 2;
    return paddingX + (index / (sortedLogs.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (weight: number) => {
    return chartHeight - paddingY - ((weight - minWeight) / rangeWeight) * (chartHeight - paddingY * 2);
  };

  // Generate points for the path
  const points = sortedLogs.map((log, idx) => ({
    x: getX(idx),
    y: getY(log.weight),
    weight: log.weight,
    date: log.date,
  }));

  const linePath = points.length > 1
    ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : "";

  // Target line height
  const targetY = getY(targetWeight);

  // Format date to local tr readable
  const formatTrShortDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-500 animate-bounce" />
            <span>Kilo Takip Merkezi</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-450 text-xs mt-0.5">Hedefinize olan sürecinizi grafiklerle izleyin, kilonuzu kontrol altında tutun.</p>
        </div>
        
        {/* Quick KPI stats badges */}
        <div className="flex gap-2 flex-wrap">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl p-2.5 px-4 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">VKI Seviyesi</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                {bmi.toFixed(1)} <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-md font-bold ${bmiStatus.color}`}>{bmiStatus.label}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Current Weight */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest block">Mevcut Ağırlık</span>
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">{currentWeight.toFixed(1)} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">kg</span></span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">Boy: {height} cm</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Saved Target weight */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden min-h-[120px] transition-colors">
          {isEditingTarget ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const num = parseFloat(tempTargetInput);
                if (!isNaN(num) && num > 10 && num < 300) {
                  onUpdateTargetWeight(num);
                  setIsEditingTarget(false);
                }
              }}
              className="flex-1 flex flex-col justify-between h-full"
            >
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-extrabold uppercase tracking-widest block mb-1">Hedef Kilo Güncelle</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    required
                    autoFocus
                    value={tempTargetInput}
                    onChange={(e) => setTempTargetInput(e.target.value)}
                    className="w-20 px-2 py-1 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">kg</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="submit"
                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTarget(false)}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold rounded-md cursor-pointer transition-all"
                >
                  İptal
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-505 font-extrabold uppercase tracking-widest block">Hedef Ağırlık</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">{targetWeight.toFixed(1)} <span className="text-sm font-bold text-emerald-550/80">kg</span></span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>
                    {targetRemaining > 0 
                      ? `${targetRemaining.toFixed(1)} kg kaldı` 
                      : targetRemaining === 0 
                      ? "Hedefe Ulaştınız! 🎉" 
                      : `Hedefin ${Math.abs(targetRemaining).toFixed(1)} kg altındasınız`}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTarget(true);
                  setTempTargetInput(String(targetWeight));
                }}
                className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-990/50 flex items-center justify-center text-emerald-606 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700 transition-all active:scale-95 cursor-pointer"
                title="Hedef Kiloyu Güncelle"
              >
                <Target className="w-6 h-6 animate-pulse" />
              </button>
            </>
          )}
        </div>

        {/* Card 3: Weight Change trend line */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-505 font-extrabold uppercase tracking-widest block">Toplam Değişim</span>
            <span className={`text-3xl font-black font-mono tracking-tight ${totalDifference <= 0 ? "text-emerald-500" : "text-amber-500"}`}>
              {totalDifference > 0 ? `+${totalDifference.toFixed(1)}` : totalDifference.toFixed(1)} <span className="text-sm font-bold">kg</span>
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
              <span>İlk kayıttan bu yana</span>
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${totalDifference <= 0 ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-150 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-500 dark:text-amber-400"}`}>
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Chart & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Graphic weight graph (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Ağırlık Değişim Grafiği</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450">Zaman içerisindeki kilo artış veya azalış trend çizgisi.</p>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/35 px-2.5 py-1 rounded-lg">Klinik Trend</span>
          </div>

          {/* SVG Interactive Chart Box */}
          <div className="relative w-full aspect-[2.5/1] min-h-[220px] bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150/60 dark:border-slate-850 p-2 overflow-hidden">
            {sortedLogs.length < 2 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-450">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Yetersiz Veri Noktası</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Grafiğin çizilebilmesi için en az iki farklı güne kilo kaydı girmelisiniz.</p>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="chart-smooth-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                    const yVal = paddingY + p * (chartHeight - paddingY * 2);
                    const weightLabel = maxWeight - p * rangeWeight;
                    return (
                      <g key={i} className="opacity-40">
                        <line
                          x1={paddingX}
                          y1={yVal}
                          x2={chartWidth - paddingX}
                          y2={yVal}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800/80"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 10}
                          y={yVal + 3}
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {Math.round(weightLabel)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Date Grid Lines */}
                  {points.map((p, i) => (
                    <line
                      key={i}
                      x1={p.x}
                      y1={paddingY}
                      x2={p.x}
                      y2={chartHeight - paddingY}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-900/60 opacity-60"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Target Weight horizontal guidance line */}
                  <line
                    x1={paddingX}
                    y1={targetY}
                    x2={chartWidth - paddingX}
                    y2={targetY}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    className="opacity-70"
                  />
                  <text
                    x={chartWidth - paddingX - 4}
                    y={targetY - 5}
                    fill="#059669"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    HEDEF: {targetWeight} kg
                  </text>

                  {/* Gradient Area Fill */}
                  <path d={areaPath} fill="url(#chart-smooth-gradient)" />

                  {/* Smooth Line Curve */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Dot Triggers */}
                  {points.map((p, i) => {
                    const isHovered = hoveredIndex === i;
                    return (
                      <g
                        key={i}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 8 : 4.5}
                          fill={isHovered ? "#059669" : "#10b981"}
                          stroke="white"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Smooth Chart Cursor Tooltip */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  <div
                    style={{
                      left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
                      top: `${(points[hoveredIndex].y / chartHeight) * 100 - 15}%`,
                    }}
                    className="absolute bg-slate-900 border border-slate-850 text-white rounded-xl p-2 px-3 shadow-xl text-[10px] -translate-x-1/2 -translate-y-full tracking-tight pointer-events-none z-10 animate-in zoom-in-95 duration-100 font-sans"
                  >
                    <span className="font-extrabold text-emerald-400 block font-mono text-center text-xs">
                      {points[hoveredIndex].weight.toFixed(1)} kg
                    </span>
                    <span className="text-slate-350 block mt-0.5 text-center whitespace-nowrap leading-none text-[9px]">
                      {formatTrShortDate(points[hoveredIndex].date)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SVG Chart footer helper labels */}
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold px-2 pt-1 font-mono">
            {points.length > 0 && (
              <>
                <span>🚀 {formatTrShortDate(points[0].date)}</span>
                <span className="font-sans text-[9px] text-slate-500">İncelemek için grafik noktalarının üzerine gelin.</span>
                <span>📈 {formatTrShortDate(points[points.length - 1].date)}</span>
              </>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Quick Weight Logger Form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Manual Weights logger card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block flex items-center gap-1.5 uppercase tracking-wider">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Kilo Kaydı Ekle</span>
            </span>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-1">Ölçüm Tarihi</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                  <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-1">Ağırlık (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    required
                    placeholder="Örn: 78.4"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full pl-8 pr-12 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                  />
                  <Scale className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 animate-pulse" />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450 font-mono">kg</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Kilo Kaydet</span>
              </button>
            </form>
          </div>

          {/* Quick advice section card */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 p-4.5 rounded-3xl space-y-1">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Klinik Tavsiye</span>
            </div>
            <p className="text-[11px] text-slate-650 dark:text-slate-300 leading-relaxed font-semibold">
              Vücut ağırlığı gün içinde sıvı tutulumu, sodyum alımı ve bağırsak durumuna göre dalgalanabilir. **Her sabah aç karnına, aynı saatte** tartılmanızı öneririz.
            </p>
          </div>

        </div>

      </div>

      {/* History logs records table card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Geçmiş Tartı Kayıtları</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 font-medium font-sans">Sistemde kayıtlı olan tüm tartı ölçümleriniz aşağıda kronolojik sırayla listelenir.</p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{sortedLogs.length} Ölçüm Noktası</span>
        </div>

        {/* List of weights grid table */}
        {sortedLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Kayıtlı ölçüm bulunamadı. Lütfen yeni bir tartı kaydı ekleyin.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[250px] overflow-y-auto">
            {[...sortedLogs].reverse().map((log) => (
              <div key={log.date} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-950/20 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{log.date}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTrShortDate(log.date)}</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono text-sm">{log.weight.toFixed(1)} kg</span>
                  <button
                    onClick={() => onDeleteWeightLog(log.date)}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 font-bold transition-all cursor-pointer p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/25"
                    title="Bu kaydı sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
