import React, { useState, useRef } from "react";
import { Sparkles, Camera, Upload, Trash2, Check, AlertCircle, RefreshCw, Plus, Coffee, Utensils, Moon, Candy } from "lucide-react";
import { FoodItem, MealType, AnalysisResponseData } from "../types";

interface AIAnalystProps {
  onAddFoodItems: (items: Omit<FoodItem, "id">[], mealType: MealType) => void;
  defaultMealType: MealType;
}

export default function AIAnalyst({ onAddFoodItems, defaultMealType }: AIAnalystProps) {
  const [prompt, setPrompt] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponseData | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<any>(null);

  const loadingMessages = [
    "Yapay Zeka gıdaları inceliyor...",
    "Besin porsiyonları hesaplanıyor...",
    "Makro ve mikro elementler ayrıştırılıyor...",
    "Diyetisyen yorumu hazıranıyor..."
  ];

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Lütfen sadece resim dosyası seçin.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setImageBase64(base64Data);
      setImageMimeType(file.type);
      setImagePreviewUrl(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const clearImage = () => {
    setImageBase64(null);
    setImageMimeType(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerAnalysis = async () => {
    if (!prompt.trim() && !imageBase64) {
      setError("Yiyecek analizi için bir metin yazmalı veya bir tabak fotoğrafı yüklemelisiniz.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setAnalysisResult(null);
    setLoadingStep(0);

    // Dynamic fake stepper for fun UX
    loadingIntervalRef.current = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          image: imageBase64,
          mimeType: imageMimeType
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Sunucu analizi tamamlayamadı.");
      }

      const data: AnalysisResponseData = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || "Yapay zeka analizi sırasında bir bağlantı veya işlem hatası oluştu.");
    } finally {
      setIsLoading(false);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
  };

  const handleSaveResult = () => {
    if (!analysisResult) return;
    onAddFoodItems(analysisResult.items, mealType);
    resetForm();
  };

  const resetForm = () => {
    setPrompt("");
    clearImage();
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div id="ai-analyst" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">Yapay Zeka Akıllı Menü Analizör</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ne yediğinizi yazın veya fotoğrafını yükleyin, detaylı çözümler alın.</p>
          </div>
        </div>
      </div>

    {!analysisResult && !isLoading ? (
      <div className="space-y-4">
        {/* Meal Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Öğün Seçimi</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: "breakfast", label: "Kahvaltı", icon: Coffee },
              { type: "lunch", label: "Öğle", icon: Utensils },
              { type: "dinner", label: "Akşam", icon: Moon },
              { type: "snack", label: "Aperatif", icon: Candy }
            ].map((m) => {
              const IconComp = m.icon;
              const active = mealType === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => setMealType(m.type as MealType)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    active 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold" 
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <IconComp className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Area */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Ne Yediniz? (Detaylı Tanımlayın)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Örn: 1 tabak mercimek çorbası, yanına 1 porsiyon tavuk pirzola ve bol yeşillikli zeytinyağlı salata yedim."
            className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 resize-none transition-all"
          />
        </div>

        {/* Drag & Drop Image Uploader */}
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-4 transition-all text-center relative ${
            isDragActive 
              ? "border-emerald-500 bg-emerald-50/30" 
              : imagePreviewUrl 
                ? "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" 
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/45 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="hidden"
          />

          {imagePreviewUrl ? (
            <div className="flex items-center space-x-4">
              <img 
                src={imagePreviewUrl} 
                alt="Food Preview" 
                className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
              />
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tabak Resmi Başarıyla Seçildi</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Yapay Zeka bu görseli besinsel açıdan tarayacaktır.</p>
              </div>
              <button 
                onClick={clearImage}
                className="p-2 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all"
                title="Resmi kaldır"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer flex flex-col items-center justify-center py-2"
            >
              <div className="p-3 bg-white dark:bg-slate-800 shadow-xs rounded-full text-slate-500 mb-2 border border-slate-100 dark:border-slate-800">
                <Camera className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-305">Tabak Fotoğrafı Ekleyin (Opsiyonel)</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Resmi buraya sürükleyin veya tıklayarak yükleyin</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-start space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        )}

        <button
          onClick={triggerAnalysis}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-md active:scale-98"
        >
          <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
          <span>Öğünü Yapay Zeka ile Analiz Et</span>
        </button>
      </div>
    ) : null}

    {isLoading ? (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 animate-pulse">
            {loadingMessages[loadingStep]}
          </p>
          <p className="text-xs text-slate-400 mt-1">Gelişmiş besin haritalama sistemi devrede</p>
        </div>
      </div>
    ) : null}

    {analysisResult && !isLoading ? (
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        <div className="bg-emerald-50/55 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Yapay Zeka Sonucu</h4>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
            "{analysisResult.summary}"
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tespit Edilen Besinler ve Porsiyonlar</h4>
          <div className="space-y-2">
            {analysisResult.items.map((item, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800 p-3 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                  <p className="text-slate-500 dark:text-slate-450 text-[11px] mt-0.5">{item.portion}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">{item.calories} kcal</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">
                    P: {item.protein}g | K: {item.carbs}g | Y: {item.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-4 gap-2 bg-slate-900 dark:bg-slate-950 text-white p-3 rounded-2xl text-center border dark:border-slate-800">
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Toplam Kalori</p>
            <p className="text-sm font-bold text-emerald-400">{analysisResult.totalCalories} kcal</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium font-mono">Protein</p>
            <p className="text-xs font-semibold font-mono">{analysisResult.totalProtein}g</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium font-mono">Karb.</p>
            <p className="text-xs font-semibold font-mono">{analysisResult.totalCarbs}g</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium font-mono">Yağ</p>
            <p className="text-xs font-semibold font-mono">{analysisResult.totalFat}g</p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={resetForm}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold py-3 rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yeniden Analiz</span>
          </button>
          <button
            onClick={handleSaveResult}
            className="flex-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{mealType === "breakfast" ? "Kahvaltı'ya" : mealType === "lunch" ? "Öğle Yemeği'ne" : mealType === "dinner" ? "Akşam Yemeği'ne" : "Aperatifler'e"} Ekle</span>
          </button>
        </div>
      </div>
    ) : null}
    </div>
  );
}
