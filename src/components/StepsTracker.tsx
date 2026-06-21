import React, { useState, useEffect } from "react";
import { 
  Footprints, Heart, Check, X, ShieldAlert, Award, TrendingUp, Sparkles, 
  HelpCircle, Info, RefreshCw, Calendar, Smartphone, Globe, Apple, Activity
} from "lucide-react";
import { DayLog, DailyTargets } from "../types";
import { UserProfile } from "./ProfileModal";

interface StepsTrackerProps {
  logs: Record<string, DayLog>;
  activeDate: string;
  onUpdateSteps: (dateStr: string, steps: number) => void;
  profile: UserProfile;
  datesSequence: string[];
}

export function StepsTracker({ 
  logs, 
  activeDate, 
  onUpdateSteps, 
  profile,
  datesSequence 
}: StepsTrackerProps) {
  // App-level default steps goal or localstate setting
  const [stepGoal, setStepGoal] = useState<number>(() => {
    const saved = localStorage.getItem("PRO_CAL_STEP_GOAL");
    return saved ? Number(saved) : 10000;
  });

  const [syncStatus, setSyncStatus] = useState<"not_connected" | "connecting" | "connected">(() => {
    const saved = localStorage.getItem("PRO_CAL_HEALTH_SYNC_STATUS");
    return (saved as any) || "not_connected";
  });

  const [connectedApp, setConnectedApp] = useState<"apple" | "google" | "fitbit" | "none">(() => {
    const saved = localStorage.getItem("PRO_CAL_CONNECTED_HEALTH_APP");
    return (saved as any) || "none";
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [animatingSync, setAnimatingSync] = useState(false);
  const [manualInputValue, setManualInputValue] = useState("");

  const activeLog = logs[activeDate];
  const currentSteps = activeLog?.steps || 0;

  // Calculate stats based on step goal
  const stepPercent = Math.min(100, Math.round((currentSteps / stepGoal) * 100));
  
  // Calculate active calories burned based on user's real weight
  // Standard equation: 0.04 * steps * (weight in kg / 70)
  const caloriesBurned = Math.round(currentSteps * 0.04 * (profile.weight / 70));
  
  // Approximately 0.00075 Km per step
  const distanceKm = Number((currentSteps * 0.00075).toFixed(2));

  // Handle setting targets
  const handleUpdateGoal = (newGoal: number) => {
    if (newGoal < 1000) return;
    setStepGoal(newGoal);
    localStorage.setItem("PRO_CAL_STEP_GOAL", String(newGoal));
    triggerNotification(`Günlük adım hedefiniz ${newGoal.toLocaleString("tr-TR")} adım olarak güncellendi.`);
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Simulate syncing from Apple Health / Google Fit
  const handleSyncNow = () => {
    if (syncStatus !== "connected") {
      triggerNotification("Öncelikle bir sağlık uygulaması (Apple Health veya Google Fit) ile senkronizasyon kurmalısınız.");
      return;
    }

    setAnimatingSync(true);
    setTimeout(() => {
      // Simulate generated steps for today or active date (between 6,000 and 12,000)
      const randomSteps = Math.floor(Math.random() * 5000) + 7000;
      onUpdateSteps(activeDate, randomSteps);
      setAnimatingSync(false);
      triggerNotification(`Sağlık uygulamasından ${randomSteps.toLocaleString("tr-TR")} adım başarıyla senkronize edildi!`);
    }, 1800);
  };

  const handleConnectApp = (appType: "apple" | "google" | "fitbit") => {
    setSyncStatus("connecting");
    setTimeout(() => {
      setSyncStatus("connected");
      setConnectedApp(appType);
      localStorage.setItem("PRO_CAL_HEALTH_SYNC_STATUS", "connected");
      localStorage.setItem("PRO_CAL_CONNECTED_HEALTH_APP", appType);
      
      // Populate some mock step counts if the current day has 0 steps
      if (currentSteps === 0) {
        const initialSteps = Math.floor(Math.random() * 4000) + 8000;
        onUpdateSteps(activeDate, initialSteps);
      }
      
      triggerNotification(`${appType === "apple" ? "Apple Health" : appType === "google" ? "Google Fit" : "Fitbit"} entegrasyonu başarıyla aktif edildi!`);
    }, 1500);
  };

  const handleDisconnect = () => {
    setSyncStatus("not_connected");
    setConnectedApp("none");
    localStorage.setItem("PRO_CAL_HEALTH_SYNC_STATUS", "not_connected");
    localStorage.setItem("PRO_CAL_CONNECTED_HEALTH_APP", "none");
    triggerNotification("Sağlık uygulaması bağlantısı kesildi.");
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(manualInputValue, 10);
    if (isNaN(parsed) || parsed < 0) return;
    onUpdateSteps(activeDate, parsed);
    setManualInputValue("");
    triggerNotification(`Adım bilgisi güncellendi: ${parsed.toLocaleString("tr-TR")} adım.`);
  };

  // Fast select goals
  const goalPresets = [6000, 8000, 10000, 12000];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Stats Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Ring Progress Visualization */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-xs">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 leading-none self-start">Bugünün İlerlemesi</h3>
          
          <div className="relative w-44 h-44 flex items-center justify-center mt-2">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="74"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r="74"
                strokeDasharray={464.9}
                strokeDashoffset={464.9 - (464.9 * stepPercent) / 100}
                className="stroke-emerald-500 transition-all duration-700 ease-out"
                strokeWidth="12"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            
            {/* Embedded details */}
            <div className="absolute flex flex-col items-center justify-center">
              <Footprints className="w-7 h-7 text-emerald-500 animate-bounce mb-1" />
              <span className="text-2xl font-black font-mono tracking-tight text-slate-800 dark:text-slate-100">{currentSteps.toLocaleString("tr-TR")}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">/ {stepGoal.toLocaleString("tr-TR")}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/45">
            <Award className="w-3.5 h-3.5" />
            <span>Hedefinizin %{stepPercent}'ine ulaştınız</span>
          </div>
        </div>

        {/* Center Card: Core Step Metrics calculated scientifically */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Sağlık Kazanımları</h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold px-2 py-1 rounded-md border border-slate-200/40 dark:border-slate-700/50">Canlı Hesaplanan</span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Yakılan Kalori</p>
              <h4 className="text-xl font-black font-mono text-slate-800 dark:text-slate-100 tracking-tight">{caloriesBurned} <span className="text-xs text-slate-400 font-normal">kcal</span></h4>
              <p className="text-[9px] text-slate-400 mt-1">Aktif metabolizma hızıyla hesaplandı</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Yürünen Mesafe</p>
              <h4 className="text-xl font-black font-mono text-slate-800 dark:text-slate-100 tracking-tight">{distanceKm} <span className="text-xs text-slate-400 font-normal">km</span></h4>
              <p className="text-[9px] text-slate-400 mt-1">Sizin adım genişliğinize göre</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Adımlarınız, günlük kalori açığınızı ve makro dengenizi optimize eder. Aktif kaldığınızda klinisyen ve yapay zeka asistanı daha hassas analizler raporlar.
            </p>
          </div>
        </div>

        {/* Right Card: Integration Quick Setup / Simulated Action */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Entegrasyon Hub</h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${syncStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                <span className="text-[10px] text-slate-500 font-extrabold">{syncStatus === "connected" ? "Aktif" : "Pasif"}</span>
              </div>
            </div>

            {/* If Not Connected display connection prompt */}
            {syncStatus !== "connected" ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cihazınızın varsayılan sağlık servislerini (Apple Health, Google Fit gibi) bağlayarak adımlarınızın her gün arka planda otomatik senkronize olmasını sağlayın.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleConnectApp("apple")}
                    className="flex items-center gap-1.5 justify-center py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 cursor-pointer transition-all active:scale-97"
                  >
                    <Apple className="w-3.5 h-3.5" />
                    <span>Apple Health</span>
                  </button>
                  <button
                    onClick={() => handleConnectApp("google")}
                    className="flex items-center gap-1.5 justify-center py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 cursor-pointer transition-all active:scale-97"
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    <span>Google Fit</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {connectedApp === "apple" ? (
                      <Apple className="w-6 h-6 text-slate-800 dark:text-white" />
                    ) : connectedApp === "google" ? (
                      <Activity className="w-6 h-6 text-rose-500" />
                    ) : (
                      <Smartphone className="w-6 h-6 text-emerald-500" />
                    )}
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                        {connectedApp === "apple" ? "Apple Health" : connectedApp === "google" ? "Google Fit" : "Fitbit"}
                      </h4>
                      <p className="text-[10px] text-slate-400">Bulut verileri otomatik çekiliyor</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDisconnect}
                    className="text-[10px] font-extrabold text-red-500 hover:text-red-400 bg-red-50 dark:bg-red-950/10 border border-transparent hover:border-red-900/20 px-2 py-1 rounded-lg cursor-pointer transition-all"
                  >
                    Bağlantıyı Kes
                  </button>
                </div>

                <button
                  onClick={handleSyncNow}
                  disabled={animatingSync}
                  className="w-full flex items-center gap-2 justify-center py-2.5 px-4 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-97 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${animatingSync ? "animate-spin" : ""}`} />
                  <span>{animatingSync ? "Veriler Çekiliyor..." : "Şimdi Buluttan Senkronize Et"}</span>
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
            <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold mb-2.5">Hedef Preseti Belirle</h4>
            <div className="flex gap-2">
              {goalPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleUpdateGoal(preset)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                    stepGoal === preset
                      ? "bg-slate-900 dark:bg-emerald-950/30 text-emerald-400 border-slate-800 dark:border-emerald-500/40"
                      : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-755 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/60"
                  }`}
                >
                  {preset / 1000}K
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Manual steps entry panel & Chronological History view side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center: Past 7 Days Custom Activity Visual Analytics Graph (Tailwind Based) */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">Haftalık Aktivite Seviyeleri</h3>
                <p className="text-[10px] text-slate-400 mt-1">Son 7 güne ait fiziki aktivite ve adım trendi</p>
              </div>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-extrabold px-2 py-1 rounded-md border border-emerald-100/60 dark:border-emerald-900/40">7 Günlük Rapor</span>
            </div>

            {/* Render Tailwind Graphic for Steps */}
            <div className="h-52 w-full mt-6 flex items-end justify-between px-2 sm:px-4 relative">
              
              {/* Grid Y-Lines background */}
              <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none pb-5 opacity-30">
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 w-full" />
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 w-full" />
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 w-full" />
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 w-full" />
              </div>

              {/* Loop Day sequences */}
              {datesSequence.map((dateStr) => {
                const dayLog = logs[dateStr];
                const daySteps = dayLog?.steps || 0;
                
                // Max height mapping relative to 15,000 steps
                const maxScalar = 15000;
                const percentHeight = Math.min(100, (daySteps / maxScalar) * 100);
                
                const d = new Date(dateStr);
                const isSelected = activeDate === dateStr;
                const dayName = d.toLocaleDateString("tr-TR", { weekday: "short" });
                const dayNum = d.getDate();

                return (
                  <div key={dateStr} className="flex flex-col items-center flex-1 h-full justify-end z-10 px-1 sm:px-2 group">
                    
                    {/* Tooltip value on hover */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-[9px] py-1 px-2 rounded-lg -translate-y-12 shrink-0 pointer-events-none shadow-md z-30 mb-8 font-mono font-bold">
                      {daySteps.toLocaleString("tr-TR")} Adım
                    </div>

                    {/* Bar graphic */}
                    <div 
                      style={{ height: `${percentHeight}%`, minHeight: daySteps > 0 ? "8px" : "2px" }}
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ease-out cursor-pointer ${
                        isSelected 
                          ? "bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-teal-400 shadow-md shadow-emerald-500/20" 
                          : "bg-slate-200/80 dark:bg-slate-800 hover:bg-emerald-300 dark:hover:bg-emerald-800/60"
                      }`}
                    />

                    {/* Day description label */}
                    <div className="text-[10px] font-bold mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 w-full text-center">
                      <span className={`${isSelected ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}>{dayName}</span>
                      <span className={`block text-[9px] opacity-70 font-mono ${isSelected ? "text-emerald-500" : ""}`}>{dayNum}</span>
                    </div>

                  </div>
                );
              })}

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-505 bg-emerald-500" /> Seçili Gün</span>
            <span className="font-mono font-bold text-slate-500 dark:text-slate-400">Maksimum Ölçek: 15K Adım</span>
          </div>
        </div>

        {/* Right Card: Manual steps manipulation log addition */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center space-x-2 mr-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">Seçili Gün Girişi</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  {new Date(activeDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}
                </span>
              </div>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide mb-1.5">Manuel Adım Ekle / Güncelle</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={manualInputValue}
                    onChange={(e) => setManualInputValue(e.target.value)}
                    placeholder="Örn: 8500"
                    min="0"
                    max="100000"
                    className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 font-mono text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 hover:bg-slate-850 dark:hover:bg-slate-700 text-emerald-400 font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-97"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </form>

            {/* Info and Tips for health benefits */}
            <div className="mt-6 space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">Egzersiz / Adım Faydaları</h4>
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Kardiyovasküler kalp sağlığını destekler.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Bağışıklık sistemini ve metabolizmayı hızlandırır.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Stres seviyesini düşürür ve uyku kalitesini artırır.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400 px-4 py-3 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 flex items-center justify-between mt-4">
            <span className="text-[11px] font-bold">Mevcut Gün Kaydı:</span>
            <span className="text-sm font-black font-mono">{currentSteps.toLocaleString("tr-TR")} Adım</span>
          </div>
        </div>

      </div>

    </div>
  );
}
