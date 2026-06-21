import React, { useState, useEffect } from "react";
import { X, User, Mail, Sparkles, Scale, Check } from "lucide-react";

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  targetWeight: number;
  activityLevel: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...profile });
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col my-auto transition-colors">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-center space-x-2.5 z-10">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <User className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-none">Kişisel Klinik Profil</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Öğün ve kalori hedefleriniz için doldurunuz.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all cursor-pointer p-1.5 rounded-lg bg-slate-850"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Active Premium badge promo */}
          <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100/80 dark:border-emerald-900/30 p-3 sm:p-3.5 rounded-2xl flex items-start space-x-2.5">
            <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block text-[9px] bg-emerald-600 text-white font-black tracking-wider uppercase px-2 py-0.5 rounded-md leading-none">Premium Üye</span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold mt-1 leading-tight">AI Diyetisyen Desteği Aktif</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-normal mt-0.5">Tüm gıda analizleri ve kalori tavanları profilinize göre otomatik hesaplanır.</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Name Input */}
            <div>
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Ad Soyad</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-8.5 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold font-sans"
                  placeholder="Örn: Adem Gümüş"
                />
                <User className="absolute left-2.5 top-2 sm:top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">E-Posta Adresi</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-8.5 pr-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold font-sans"
                  placeholder="Örn: gumusayadem9@gmail.com"
                />
                <Mail className="absolute left-2.5 top-2 sm:top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Age & Gender Group */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Yaş</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Cinsiyet</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-2.5 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold"
                >
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>

            {/* Physical Metrics Grid */}
            <div className="bg-slate-50/70 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 p-3 sm:p-4 rounded-2xl space-y-2.5">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
                <span>Fiziksel Ölçüler</span>
              </span>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-450 block mb-0.5">Boy (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    required
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-450 block mb-0.5">Kilo (kg)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-450 block mb-0.5 font-sans">Hedef (kg)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    required
                    value={formData.targetWeight}
                    onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) })}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Activity Level selection */}
            <div>
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 dark:text-slate-440 uppercase tracking-widest block mb-1">Aktivite Seviyesi</label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                className="w-full px-2.5 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold"
              >
                <option value="Hareketsiz (Sedanter)">Hareketsiz (Ofis / Hareketsiz Yaşam)</option>
                <option value="Hafif Aktif">Hafif Aktif (Haftada 1-2 gün yürüyüş)</option>
                <option value="Orta Aktif">Orta Aktif (Haftada 3-4 gün spor)</option>
                <option value="Çok Aktif">Çok Aktif (Haftada 5-7 gün ağır spor)</option>
              </select>
            </div>

          </div>

          {/* Bottom Confirmation panel showing feedback */}
          {showSavedFeedback && (
            <div className="bg-emerald-500 text-white rounded-xl p-2.5 text-center flex items-center justify-center space-x-2 text-xs font-bold animate-pulse">
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
              <span>Profil Başarıyla Güncellendi!</span>
            </div>
          )}

          {/* Form Controls Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer animate-none"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-4.5 py-1.5 sm:py-2 bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Kaydet
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
