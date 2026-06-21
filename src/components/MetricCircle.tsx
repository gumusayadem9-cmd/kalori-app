import { Flame, CheckCircle2 } from "lucide-react";

interface MetricCircleProps {
  consumed: number;
  target: number;
}

export default function MetricCircle({ consumed, target }: MetricCircleProps) {
  const remaining = target - consumed;
  const isOver = remaining < 0;
  
  // Calculate SVG stroke parameters
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Cap percentage at 100 for path drawing (preventing overlapping loops)
  const percent = Math.min(100, Math.max(0, (consumed / target) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl shadow-xs relative overflow-hidden">
      {/* Subtle glowing radial background element */}
      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-center w-[180px] h-[180px]">
        {/* SVG Progress Circle */}
        <svg className="transform -rotate-90 w-[185px] h-[185px] drop-shadow-sm">
          {/* Background circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.08)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={92.5}
            cy={92.5}
          />
          {/* Progress circle */}
          <circle
            stroke={isOver ? "#f43f5e" : "#10b981"} // Rose if exceeded, Emerald if normal
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={92.5}
            cy={92.5}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Text Center Overlays */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <Flame className={`w-6 h-6 mb-1 ${isOver ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
          <span className="text-3xl font-extrabold font-mono tracking-tight">
            {Math.abs(remaining)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {isOver ? "kcal Fazla" : "kcal Kalan"}
          </span>
        </div>
      </div>

      {/* Target Tracker Legend */}
      <div className="grid grid-cols-2 gap-8 w-full border-t border-slate-800/80 pt-4 mt-2 text-center text-xs">
        <div>
          <p className="text-slate-400 mb-0.5">Alınan Enerji</p>
          <p className="font-bold text-sm font-mono text-slate-100">{consumed} kcal</p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">Günlük Hedef</p>
          <p className="font-bold text-sm font-mono text-slate-100">{target} kcal</p>
        </div>
      </div>

      {/* Exceeded Warning Banner */}
      {isOver && (
        <div className="mt-4 w-full bg-rose-500/15 border border-rose-500/25 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 text-rose-300 text-[11px] font-semibold animate-pulse">
          <span>⚠️ Belirlenen Günlük Kalori Limiti Aşıldı!</span>
        </div>
      )}

      {!isOver && remaining < 200 && remaining > 0 && (
        <div className="mt-4 w-full bg-emerald-500/15 border border-emerald-500/25 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 text-emerald-300 text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Neredeyse günlük kalori hedefinize ulaştınız!</span>
        </div>
      )}
    </div>
  );
}
