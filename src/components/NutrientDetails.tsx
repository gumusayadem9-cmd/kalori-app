import { AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

interface NutrientDetailsProps {
  fiber: number;
  fiberTarget: number;
  sodium: number; // mg
  sodiumLimit: number; // mg
  sugar: number; // g
  sugarLimit: number; // g
}

export default function NutrientDetails({ fiber, fiberTarget, sodium, sodiumLimit, sugar, sugarLimit }: NutrientDetailsProps) {
  // Fiber Status
  const fiberPercent = Math.min(100, Math.round((fiber / fiberTarget) * 100));
  const fiberStatus = fiber >= fiberTarget ? "ideal" : fiber >= fiberTarget * 0.5 ? "orta" : "dusuk";

  // Sodium Status
  const sodiumPercent = Math.min(100, Math.round((sodium / sodiumLimit) * 100));
  const sodiumStatus = sodium > sodiumLimit ? "yuksek" : sodium > sodiumLimit * 0.8 ? "sinirda" : "normal";

  // Sugar Status
  const sugarPercent = Math.min(100, Math.round((sugar / sugarLimit) * 100));
  const sugarStatus = sugar > sugarLimit ? "yuksek" : sugar > sugarLimit * 0.8 ? "sinirda" : "normal";

  return (
    <div id="nutrient-analysis" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5 transition-colors">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 tracking-tight text-sm">Detaylı Mikrobesin Analizi</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">Sağlıklı bir metabolizma için kritik diğer besin bileşenleri.</p>
      </div>

      {/* Fiber Tracker Row */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Diyet Lifi</span>
            <span className="text-[10px] text-gray-400 ml-1">(Sindirim Dostu)</span>
          </div>
          <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">{fiber.toFixed(1)}g / {fiberTarget}g</span>
        </div>
        <div className="h-2 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-100/50 dark:border-slate-850">
          <div 
            style={{ width: `${fiberPercent}%` }} 
            className={`h-full rounded-full transition-all duration-500 ${
              fiberStatus === "ideal" ? "bg-emerald-500" : fiberStatus === "orta" ? "bg-amber-400" : "bg-slate-300"
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px]">
          {fiberStatus === "ideal" ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Sindirim Sağlığı için Harika!
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
              Hedefe ulaşmak için sebze ve tahılı artırın (+{(fiberTarget - fiber).toFixed(1)}g lif)
            </span>
          )}
          <span className="text-gray-400 font-medium">Hedef %{fiberPercent}</span>
        </div>
      </div>

      {/* Sugar Warning Row */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Basit Şeker</span>
            <span className="text-[10px] text-gray-400 ml-1">(Rafine & Doğal Toplamı)</span>
          </div>
          <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">{sugar.toFixed(1)}g / {sugarLimit}g</span>
        </div>
        <div className="h-2 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-100/50 dark:border-slate-850">
          <div 
            style={{ width: `${sugarPercent}%` }} 
            className={`h-full rounded-full transition-all duration-500 ${
              sugarStatus === "yuksek" ? "bg-rose-500 animate-pulse" : sugarStatus === "sinirda" ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px]">
          {sugarStatus === "yuksek" ? (
            <span className="text-rose-600 dark:text-rose-450 font-semibold bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1 animate-pulse" /> Şeker Sınırını Aştınız!
            </span>
          ) : sugarStatus === "sinirda" ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-xs">
              Sınıra yaklaştınız. Tatlı veya meyveleri dengeleyin.
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
              Güvenli bölge (Düşük glisemik indeks)
            </span>
          )}
          <span className="text-gray-400 font-medium">Limit %{sugarPercent}</span>
        </div>
      </div>

      {/* Sodium Cardiac Warning Row */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Sodyum / Tuz</span>
            <span className="text-[10px] text-gray-400 ml-1">(Kalp Sağlığı)</span>
          </div>
          <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">{Math.round(sodium)}mg / {sodiumLimit}mg</span>
        </div>
        <div className="h-2 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-100/50 dark:border-slate-850">
          <div 
            style={{ width: `${sodiumPercent}%` }} 
            className={`h-full rounded-full transition-all duration-500 ${
              sodiumStatus === "yuksek" ? "bg-rose-500 animate-pulse" : sodiumStatus === "sinirda" ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px]">
          {sodiumStatus === "yuksek" ? (
            <span className="text-rose-600 dark:text-rose-450 font-semibold bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" /> Yüksek Sodyum! (Su tutulumu riski)
            </span>
          ) : sodiumStatus === "sinirda" ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-xs">
              Sınır değerde. İşlenmiş gıdalardan kaçının.
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
              Sağlıklı mineral seviyesi
            </span>
          )}
          <span className="text-gray-400 font-medium">Limit %{sodiumPercent}</span>
        </div>
      </div>
    </div>
  );
}
