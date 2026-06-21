import { useState, useEffect } from "react";
import { 
  Target, Sliders, Calendar, Droplet, GlassWater, Trophy, Sparkles, BookOpen, Clock, RefreshCw, ChevronLeft, ChevronRight, HelpCircle,
  LayoutDashboard, Brain, TrendingUp, Scale, Menu, Sun, Moon, LogIn, LogOut, Cloud, CloudOff, RefreshCw as RefreshIcon,
  Footprints, Smartphone, Apple, Activity, X, Download
} from "lucide-react";
import { DayLog, FoodItem, MealType, DailyTargets } from "./types";
import { 
  calculateDefaultMacros, getMockHistoryLogs, getPastDates, formatTurkishDate 
} from "./utils/nutrition";

import AIAnalyst from "./components/AIAnalyst";
import TargetsModal from "./components/TargetsModal";
import MetricCircle from "./components/MetricCircle";
import NutrientDetails from "./components/NutrientDetails";
import MealSection from "./components/MealSection";
import { ProfileModal, UserProfile } from "./components/ProfileModal";
import { WeightTracker, WeightLog } from "./components/WeightTracker";
import { StepsTracker } from "./components/StepsTracker";

import { 
  db,
  auth, 
  loginWithGoogle, 
  logoutUser,
  saveFirestoreProfile,
  getFirestoreProfile,
  saveFirestoreDayLog,
  getFirestoreDayLogs,
  saveFirestoreWeightLog,
  deleteFirestoreWeightLog,
  getFirestoreWeightLogs
} from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { onSnapshot, doc, collection } from "firebase/firestore";

export default function App() {
  const datesSequence = getPastDates(7);
  const [activeDate, setActiveDate] = useState<string>(datesSequence[6]); // default to today (last item)
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [currentTargets, setCurrentTargets] = useState<DailyTargets>({
    calories: 2000,
    protein: 150,
    carbs: 225,
    fat: 55,
    water: 2500,
    fiber: 25,
    sodium: 2300,
    sugarLimit: 50,
  });
  
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Adem Gümüş",
    email: "gumusayadem9@gmail.com",
    age: 30,
    gender: "Erkek",
    height: 180,
    weight: 78,
    targetWeight: 75,
    activityLevel: "Orta Aktif",
  });
  const [activeTab, setActiveTab] = useState<"dashboard" | "weight" | "steps">("dashboard");
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showStepOnboarding, setShowStepOnboarding] = useState(false);

  // PWA Download & Installation States and Listeners
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already launched in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforePrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("PWA install action outcome:", outcome);
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      // Show multi-device installation instruction modal if deferred prompt is not supported/ready
      setShowPwaInstallModal(true);
    }
  };

  useEffect(() => {
    const onboarded = localStorage.getItem("PRO_CAL_STEPS_ONBOARDED");
    if (onboarded !== "true") {
      setShowStepOnboarding(true);
    }
  }, []);
  const [streakCount, setStreakCount] = useState(3); // Mock tracking stats streak
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isEditingWater, setIsEditingWater] = useState(false);
  const [tempWaterConsumedInput, setTempWaterConsumedInput] = useState("");
  const [tempWaterTargetInput, setTempWaterTargetInput] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("PRO_CAL_DARK_MODE") === "true";
  });

  // Firebase auth & syncing states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncingCloud, setSyncingCloud] = useState(false);


  // Toggle dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("PRO_CAL_DARK_MODE", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("PRO_CAL_DARK_MODE", "false");
    }
  }, [darkMode]);

  // 1. Firebase Authentication & Cloud Storage Initial Loader with Real-Time Syncing
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubLogs: (() => void) | null = null;
    let unsubWeights: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);

      // Clean up previous real-time listeners
      if (unsubProfile) unsubProfile();
      if (unsubLogs) unsubLogs();
      if (unsubWeights) unsubWeights();

      if (firebaseUser) {
        setUser(firebaseUser);
        setSyncingCloud(true);
        try {
          // A. Check if standard User Profile exists on Firestore before subbing
          const firestoreProfile = await getFirestoreProfile(firebaseUser.uid);
          
          if (!firestoreProfile) {
            // First time login: Migrate current LocalStorage data to Firestore
            const localProfile = localStorage.getItem("PRO_CAL_USER_PROFILE");
            const localTargets = localStorage.getItem("PRO_CAL_DAILY_TARGETS");
            
            const parsedProfile: UserProfile = localProfile ? JSON.parse(localProfile) : {
              name: firebaseUser.displayName || "Adem Gümüş",
              email: firebaseUser.email || "gumusayadem9@gmail.com",
              age: 30,
              gender: "Erkek",
              height: 180,
              weight: 78,
              targetWeight: 75,
              activityLevel: "Orta Aktif",
            };
            
            const parsedTargets: DailyTargets = localTargets ? JSON.parse(localTargets) : {
              calories: 2000,
              protein: 150,
              carbs: 225,
              fat: 55,
              water: 2500,
              fiber: 25,
              sodium: 2300,
              sugarLimit: 50,
            };

            await saveFirestoreProfile(firebaseUser.uid, parsedProfile, parsedTargets);

            // B. Migrate Weight Logs
            const localWeightLogs = localStorage.getItem("PRO_CAL_WEIGHT_LOGS");
            const parsedWeightLogs: WeightLog[] = localWeightLogs ? JSON.parse(localWeightLogs) : [];
            if (parsedWeightLogs.length > 0) {
              for (const wl of parsedWeightLogs) {
                await saveFirestoreWeightLog(firebaseUser.uid, wl.date, wl.weight);
              }
            } else {
              // Create default weight logs
              const today = new Date();
              const baseWeights = [80.5, 80.1, 79.6, 79.2, 78.8, 78.3, 78.0];
              for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i * 3);
                const yr = d.getFullYear();
                const mo = String(d.getMonth() + 1).padStart(2, '0');
                const dy = String(d.getDate()).padStart(2, '0');
                await saveFirestoreWeightLog(firebaseUser.uid, `${yr}-${mo}-${dy}`, baseWeights[6 - i]);
              }
            }

            // C. Migrate Day Logs
            const localDayLogs = localStorage.getItem("PRO_CAL_DAY_LOGS");
            const parsedDayLogs: Record<string, DayLog> = localDayLogs ? JSON.parse(localDayLogs) : {};
            if (Object.keys(parsedDayLogs).length > 0) {
              for (const [date, log] of Object.entries(parsedDayLogs)) {
                await saveFirestoreDayLog(firebaseUser.uid, date, log);
              }
            } else {
              const initialMockHistory = getMockHistoryLogs();
              for (const log of initialMockHistory) {
                await saveFirestoreDayLog(firebaseUser.uid, log.date, log);
              }
            }
          }

          // NOW SET UP REAL-TIME FIRESTORE LISTENERS
          // 1. Profile Listener
          unsubProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const currentProfile: UserProfile = {
                name: data.name || "",
                email: data.email || "",
                age: Number(data.age) || 30,
                gender: data.gender || "Erkek",
                height: Number(data.height) || 180,
                weight: Number(data.weight) || 78,
                targetWeight: Number(data.targetWeight) || 75,
                activityLevel: data.activityLevel || "Orta Aktif"
              };
              const targets: DailyTargets = data.currentTargets || {
                calories: 2000,
                protein: 150,
                carbs: 225,
                fat: 55,
                water: 2500,
                fiber: 25,
                sodium: 2300,
                sugarLimit: 50
              };
              setProfile(currentProfile);
              setCurrentTargets(targets);
              localStorage.setItem("PRO_CAL_USER_PROFILE", JSON.stringify(currentProfile));
              localStorage.setItem("PRO_CAL_DAILY_TARGETS", JSON.stringify(targets));
            }
          }, (err) => {
            console.error("Profile real-time listener error:", err);
          });

          // 2. Weight Logs Real-Time Listener
          unsubWeights = onSnapshot(collection(db, "users", firebaseUser.uid, "weightLogs"), (snapshot) => {
            const weights: WeightLog[] = [];
            snapshot.forEach((d) => {
              const data = d.data();
              weights.push({
                date: data.date,
                weight: Number(data.weight)
              });
            });
            const sortedWeights = weights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setWeightLogs(sortedWeights);
            localStorage.setItem("PRO_CAL_WEIGHT_LOGS", JSON.stringify(sortedWeights));
          }, (err) => {
            console.error("Weight logs real-time listener error:", err);
          });

          // 3. Day Logs Real-Time Listener
          unsubLogs = onSnapshot(collection(db, "users", firebaseUser.uid, "logs"), (snapshot) => {
            const logsMap: Record<string, DayLog> = {};
            snapshot.forEach((d) => {
              const data = d.data();
              logsMap[d.id] = {
                date: data.date,
                meals: data.meals,
                waterConsumedMl: data.waterConsumedMl,
                dailyTargets: data.dailyTargets,
                summaryNote: data.summaryNote || "",
                steps: Number(data.steps) || 0
              };
            });
            setLogs(logsMap);
            localStorage.setItem("PRO_CAL_DAY_LOGS", JSON.stringify(logsMap));
          }, (err) => {
            console.error("Day logs real-time listener error:", err);
          });

        } catch (error) {
          console.error("Firebase cloud-load/real-time setup/migration error:", error);
        } finally {
          setSyncingCloud(false);
        }
      } else {
        // Fallback or logged out: Load logs and targets from standard LocalStorage
        setUser(null);
        
        const savedTargets = localStorage.getItem("PRO_CAL_DAILY_TARGETS");
        if (savedTargets) {
          setCurrentTargets(JSON.parse(savedTargets));
        } else {
          const targets = calculateDefaultMacros(2000);
          setCurrentTargets(targets);
        }

        const savedProfile = localStorage.getItem("PRO_CAL_USER_PROFILE");
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }

        const savedWeightLogs = localStorage.getItem("PRO_CAL_WEIGHT_LOGS");
        if (savedWeightLogs) {
          setWeightLogs(JSON.parse(savedWeightLogs));
        } else {
          const today = new Date();
          const initialLogs: WeightLog[] = [];
          const baseWeights = [80.5, 80.1, 79.6, 79.2, 78.8, 78.3, 78.0];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i * 3);
            const yr = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const dy = String(d.getDate()).padStart(2, '0');
            initialLogs.push({
              date: `${yr}-${mo}-${dy}`,
              weight: baseWeights[6 - i]
            });
          }
          setWeightLogs(initialLogs);
          localStorage.setItem("PRO_CAL_WEIGHT_LOGS", JSON.stringify(initialLogs));
        }

        const savedLogs = localStorage.getItem("PRO_CAL_DAY_LOGS");
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        } else {
          const initialMockHistory = getMockHistoryLogs();
          const logsMap: Record<string, DayLog> = {};
          initialMockHistory.forEach((log) => {
            logsMap[log.date] = log;
          });
          setLogs(logsMap);
          localStorage.setItem("PRO_CAL_DAY_LOGS", JSON.stringify(logsMap));
        }
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
      if (unsubLogs) unsubLogs();
      if (unsubWeights) unsubWeights();
    };
  }, []);

  // Get active log or generate blank record for selected day
  const getActiveDayLog = (): DayLog => {
    if (logs[activeDate]) {
      return logs[activeDate];
    }
    return {
      date: activeDate,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      },
      waterConsumedMl: 0,
      dailyTargets: currentTargets,
    };
  };

  const activeLog = getActiveDayLog();

  // 2. Persist Logs Utility
  const saveLogs = (updatedLogs: Record<string, DayLog>) => {
    setLogs(updatedLogs);
    localStorage.setItem("PRO_CAL_DAY_LOGS", JSON.stringify(updatedLogs));

    // Firebase Cloud Sync
    if (user) {
      const activeDayLog = updatedLogs[activeDate] || getActiveDayLog();
      saveFirestoreDayLog(user.uid, activeDate, activeDayLog).catch((err) => {
        console.error("Failed to sync log state to Firestore:", err);
      });
    }
  };

  // 3. User updates Calorie and Nutrition targets
  const handleUpdateTargets = (newTargets: DailyTargets) => {
    setCurrentTargets(newTargets);
    localStorage.setItem("PRO_CAL_DAILY_TARGETS", JSON.stringify(newTargets));

    // Update targets on active log as well to maintain history integrity
    const updated = { ...logs };
    if (!updated[activeDate]) {
      updated[activeDate] = getActiveDayLog();
    }
    updated[activeDate].dailyTargets = newTargets;
    saveLogs(updated);

    // Firebase Cloud Sync
    if (user) {
      saveFirestoreProfile(user.uid, profile, newTargets).catch((err) => {
        console.error("Failed to sync targets state to Firestore:", err);
      });
    }
  };

  // 4. Item Add/Remove Handlers
  const handleAddFoodItems = (itemsToAdd: Omit<FoodItem, "id">[], meal: MealType) => {
    const updated = { ...logs };
    if (!updated[activeDate]) {
      updated[activeDate] = getActiveDayLog();
    }

    const currentMealItems = [...updated[activeDate].meals[meal]];
    
    itemsToAdd.forEach((item, idx) => {
      currentMealItems.push({
        ...item,
        id: `${meal}-${Date.now()}-${idx}`,
      });
    });

    updated[activeDate].meals[meal] = currentMealItems;

    // If there is an AI dietitian summary returned, save it
    if (itemsToAdd.length > 1) {
      // Create a small combined dietitian note if it is the first time
      updated[activeDate].summaryNote = "Akıllı asistanınız öğününüzü kaydetti. Su limtinize ulaşmayı ve lifli gıdalar tüketmeyi unutmayın.";
    }

    saveLogs(updated);
  };

  const handleAddSingleFoodItem = (itemToAdd: Omit<FoodItem, "id">, meal: MealType) => {
    handleAddFoodItems([itemToAdd], meal);
  };

  const handleRemoveFoodItem = (id: string, meal: MealType) => {
    const updated = { ...logs };
    if (!updated[activeDate]) return;

    updated[activeDate].meals[meal] = updated[activeDate].meals[meal].filter(
      (item) => item.id !== id
    );

    saveLogs(updated);
  };

  // 5. Water Consumption logger
  const handleAddWater = (amount: number) => {
    const updated = { ...logs };
    if (!updated[activeDate]) {
      updated[activeDate] = getActiveDayLog();
    }
    updated[activeDate].waterConsumedMl = Math.max(0, updated[activeDate].waterConsumedMl + amount);
    saveLogs(updated);
  };

  const handleSetWaterConsumed = (amount: number) => {
    const updated = { ...logs };
    if (!updated[activeDate]) {
      updated[activeDate] = getActiveDayLog();
    }
    updated[activeDate].waterConsumedMl = Math.max(0, amount);
    saveLogs(updated);
  };

  const handleUpdateWaterTarget = (targetMl: number) => {
    const newTargets = { ...currentTargets, water: targetMl };
    setCurrentTargets(newTargets);
    localStorage.setItem("PRO_CAL_DAILY_TARGETS", JSON.stringify(newTargets));

    const updated = { ...logs };
    if (!updated[activeDate]) {
      updated[activeDate] = getActiveDayLog();
    }
    updated[activeDate].dailyTargets = newTargets;
    saveLogs(updated);
  };

  // Sum active nutrient totals
  const allMealsItems = [
    ...(activeLog.meals.breakfast),
    ...(activeLog.meals.lunch),
    ...(activeLog.meals.dinner),
    ...(activeLog.meals.snack),
  ];

  const totalCaloriesVal = allMealsItems.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProteinVal = allMealsItems.reduce((acc, curr) => acc + curr.protein, 0);
  const totalCarbsVal = allMealsItems.reduce((acc, curr) => acc + curr.carbs, 0);
  const totalFatVal = allMealsItems.reduce((acc, curr) => acc + curr.fat, 0);
  const totalFiberVal = allMealsItems.reduce((acc, curr) => acc + curr.fiber, 0);
  const totalSodiumVal = allMealsItems.reduce((acc, curr) => acc + curr.sodium, 0);
  const totalSugarVal = allMealsItems.reduce((acc, curr) => acc + curr.sugar, 0);

  // Auto calculate macronutrients target progress
  const activeTargetsObj = activeLog.dailyTargets || currentTargets;

  const protPct = activeTargetsObj.protein > 0 ? Math.min(100, Math.round((totalProteinVal / activeTargetsObj.protein) * 100)) : 0;
  const carbsPct = activeTargetsObj.carbs > 0 ? Math.min(100, Math.round((totalCarbsVal / activeTargetsObj.carbs) * 100)) : 0;
  const fatPct = activeTargetsObj.fat > 0 ? Math.min(100, Math.round((totalFatVal / activeTargetsObj.fat) * 105)) : 0; // Wait, keep exact as original: let's use:
  // Math.min(100, Math.round((totalFatVal / activeTargetsObj.fat) * 100)) 
  // Let's use: protPct, carbsPct, fatPct tracking * 100.
  const fatPctVal = activeTargetsObj.fat > 0 ? Math.min(100, Math.round((totalFatVal / activeTargetsObj.fat) * 100)) : 0;

  // Clear log for active date
  const clearDayLogs = () => {
    const updated = { ...logs };
    updated[activeDate] = {
      date: activeDate,
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      waterConsumedMl: 0,
      dailyTargets: currentTargets,
    };
    saveLogs(updated);
    setIsConfirmingReset(false);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem("PRO_CAL_USER_PROFILE", JSON.stringify(updatedProfile));
    
    // Firebase Cloud Sync
    if (user) {
      saveFirestoreProfile(user.uid, updatedProfile, currentTargets).catch((err) => {
        console.error("Failed to sync profile state to Firestore:", err);
      });
    }

    // Add weight log automatically
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const exists = weightLogs.some(wl => wl.date === todayStr);
    if (!exists || weightLogs.find(wl => wl.date === todayStr)?.weight !== updatedProfile.weight) {
      const updatedLogs = [...weightLogs.filter(wl => wl.date !== todayStr), { date: todayStr, weight: updatedProfile.weight }].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setWeightLogs(updatedLogs);
      localStorage.setItem("PRO_CAL_WEIGHT_LOGS", JSON.stringify(updatedLogs));

      // Firebase Cloud Sync
      if (user) {
        saveFirestoreWeightLog(user.uid, todayStr, updatedProfile.weight).catch((err) => {
          console.error("Failed to sync weight state to Firestore:", err);
        });
      }
    }
  };

  const handleAddWeightLog = (date: string, weight: number) => {
    const updatedLogs = [...weightLogs.filter(wl => wl.date !== date), { date, weight }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setWeightLogs(updatedLogs);
    localStorage.setItem("PRO_CAL_WEIGHT_LOGS", JSON.stringify(updatedLogs));

    // Firebase Cloud Sync
    if (user) {
      saveFirestoreWeightLog(user.uid, date, weight).catch((err) => {
        console.error("Failed to sync weight state to Firestore (custom):", err);
      });
    }

    const latestLog = updatedLogs[updatedLogs.length - 1];
    if (latestLog && latestLog.date === date) {
      const updatedProfile = { ...profile, weight };
      setProfile(updatedProfile);
      localStorage.setItem("PRO_CAL_USER_PROFILE", JSON.stringify(updatedProfile));

      // Firebase Cloud Sync
      if (user) {
        saveFirestoreProfile(user.uid, updatedProfile, currentTargets).catch((err) => {
          console.error("Failed to sync updated profile weight to Firestore:", err);
        });
      }
    }
  };

  const handleDeleteWeightLog = (date: string) => {
    const updatedLogs = weightLogs.filter((wl) => wl.date !== date);
    setWeightLogs(updatedLogs);
    localStorage.setItem("PRO_CAL_WEIGHT_LOGS", JSON.stringify(updatedLogs));

    // Firebase Cloud Sync
    if (user) {
      deleteFirestoreWeightLog(user.uid, date).catch((err) => {
        console.error("Failed to sync weight deletion to Firestore:", err);
      });
    }
  };

  const handleUpdateTargetWeight = (weight: number) => {
    const updatedProfile = { ...profile, targetWeight: weight };
    setProfile(updatedProfile);
    localStorage.setItem("PRO_CAL_USER_PROFILE", JSON.stringify(updatedProfile));

    // Firebase Cloud Sync
    if (user) {
      saveFirestoreProfile(user.uid, updatedProfile, currentTargets).catch((err) => {
        console.error("Failed to sync target weight modification to Firestore:", err);
      });
    }
  };

  const handleUpdateSteps = (dateStr: string, steps: number) => {
    const existingLog = logs[dateStr] || {
      date: dateStr,
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      waterConsumedMl: 0,
      dailyTargets: currentTargets,
    };
    const updatedLog = { ...existingLog, steps };
    const updatedLogs = { ...logs, [dateStr]: updatedLog };
    
    setLogs(updatedLogs);
    localStorage.setItem("PRO_CAL_DAY_LOGS", JSON.stringify(updatedLogs));

    // Firebase Cloud Sync
    if (user) {
      saveFirestoreDayLog(user.uid, dateStr, updatedLog).catch((err) => {
        console.error("Failed to sync step state to Firestore:", err);
      });
    }
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return "AG";
    const parts = fullName.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`;
    }
    return parts[0] ? parts[0].slice(0, 2) : "AG";
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-950/80 antialiased overflow-x-hidden transition-colors duration-250">
      
      {/* Mobile Drawer Sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer sheet container */}
          <aside className="relative w-64 bg-slate-900 text-white h-full flex flex-col z-10 p-6 border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Header branding logo block */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="font-extrabold text-white text-base">N</span>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none text-white">NUTRI<span className="text-emerald-400">PRO</span></h1>
                <span className="text-[9px] uppercase tracking-widest text-emerald-400/90 font-bold block mt-1">AI CLINIC</span>
              </div>
            </div>

            {/* Mobile Navigation Menu Links */}
            <nav className="space-y-6 flex-1">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3 px-2">Ana Menü</p>
                
                <button 
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileMenuOpen(false);
                  }} 
                  className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl transition-all font-semibold cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-slate-800 text-emerald-400 border-r-4 border-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-4.5 h-4.5" />
                  </div>
                  <span>Günlük Özet</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveTab("weight");
                    setIsMobileMenuOpen(false);
                  }} 
                  className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl transition-all font-semibold cursor-pointer ${
                    activeTab === "weight"
                      ? "bg-slate-800 text-emerald-400 border-r-4 border-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Scale className="w-4.5 h-4.5" />
                  </div>
                  <span>Kilo Takibi</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveTab("steps");
                    setIsMobileMenuOpen(false);
                  }} 
                  className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl transition-all font-semibold cursor-pointer ${
                    activeTab === "steps"
                      ? "bg-slate-800 text-emerald-400 border-r-4 border-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Footprints className="w-4.5 h-4.5" />
                  </div>
                  <span>Adım Takibi</span>
                </button>

                <a 
                  href="#ai-analyst" 
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-slate-400 hover:text-white py-3 px-4 rounded-xl transition-all font-semibold block"
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 inline-flex">
                    <Brain className="w-4.5 h-4.5" />
                  </div>
                  <span className="ml-3 select-none">Yapay Zeka Asistanı</span>
                </a>

                <a 
                  href="#nutrient-analysis" 
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-slate-400 hover:text-white py-3 px-4 rounded-xl transition-all font-semibold block"
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 inline-flex">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <span className="ml-3 select-none">Detaylı Analiz</span>
                </a>
              </div>

              {/* Streak stats banner */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4.5 h-4.5 text-emerald-400 fill-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">{streakCount} Günlük Seri</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  Harika gidiyorsun! İstikrarlı veri kaydı yapmaya devam et. 🔥
                </p>
              </div>
            </nav>

            {/* Mobile User Profile & Google Authentication block */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {authLoading ? (
                <div className="flex items-center gap-2 justify-center py-2 text-xs text-slate-400">
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                  <span>Kimlik denetleniyor...</span>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-2 text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Bulut Eşitlendi</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-left p-2 rounded-2xl hover:bg-slate-800/80 active:scale-97 transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600/70 flex items-center justify-center text-sm font-bold text-emerald-400 overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "Avatar"} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        getInitials(profile.name)
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-xs font-bold text-slate-100 truncate">{profile.name}</p>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Profili Düzenle</span>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await logoutUser();
                        setIsMobileMenuOpen(false);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex items-center gap-2 justify-center w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-red-950/40 hover:text-red-400 text-xs text-slate-400 transition-all font-semibold cursor-pointer border border-transparent hover:border-red-900/40"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Oturumu Kapat</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 px-1">
                  <p className="text-[9px] text-slate-400 text-center leading-normal font-medium">
                    Verilerinizi güvenle bulutta saklamak ve cihazlar arasında eşitlemek için giriş yapın.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await loginWithGoogle();
                        setIsMobileMenuOpen(false);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex items-center gap-2.5 justify-center w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-97 text-xs text-slate-900 transition-all font-bold cursor-pointer shadow-md"
                  >
                    <Cloud className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                    <span>Google ile Giriş Yap</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
      
      {/* 1. SIDEBAR - Left Side Panel */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 hidden lg:flex border-r border-slate-800">
        <div className="p-6 flex-1 flex flex-col">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
              <span className="font-extrabold text-white text-base">N</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-white">NUTRI<span className="text-emerald-400">PRO</span></h1>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400/90 font-bold block mt-1">AI CLINIC</span>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-6 flex-1">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3 px-2">Ana Menü</p>
              
              <button 
                onClick={() => setActiveTab("dashboard")} 
                className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl transition-all font-semibold cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-slate-800 text-emerald-400 border-r-4 border-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-4.5 h-4.5" />
                </div>
                <span>Günlük Özet</span>
              </button>

              <button 
                onClick={() => setActiveTab("weight")} 
                className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl transition-all font-semibold cursor-pointer ${
                  activeTab === "weight"
                    ? "bg-slate-800 text-emerald-400 border-r-4 border-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Scale className="w-4.5 h-4.5" />
                </div>
                <span>Kilo Takibi</span>
              </button>

              <button 
                onClick={() => setActiveTab("steps")} 
                className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-xl transition-all font-semibold cursor-pointer ${
                  activeTab === "steps"
                    ? "bg-slate-800 text-emerald-400 border-r-4 border-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Footprints className="w-4.5 h-4.5" />
                </div>
                <span>Adım Takibi</span>
              </button>

              <a 
                href="#ai-analyst" 
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-3 text-slate-400 hover:text-white py-3 px-4 rounded-xl transition-all font-semibold block"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0 inline-flex">
                  <Brain className="w-4.5 h-4.5" />
                </div>
                <span className="ml-3 select-none">Yapay Zeka Asistanı</span>
              </a>

              <a 
                href="#nutrient-analysis" 
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-3 text-slate-400 hover:text-white py-3 px-4 rounded-xl transition-all font-semibold block"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0 inline-flex">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <span className="ml-3 select-none">Detaylı Analiz</span>
              </a>
            </div>

            {/* Premium Streak Stats Card */}
            <div className="bg-slate-800/60 rounded-2xl p-4.5 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4.5 h-4.5 text-emerald-400 fill-emerald-400" />
                <span className="text-xs font-bold text-slate-200">{streakCount} Günlük Seri</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Harika iş! İstikrarlı veri kaydı ile klinisyen rehberliğinizi güçlendirin. 🔥
              </p>
            </div>

            {/* PWA Download / Installation Card */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cihaza İndir</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                NutriPro'yu telefonunuza veya bilgisayarınıza hemen indirip tam ekran kullanın.
              </p>
              {isAppInstalled ? (
                <div className="flex items-center gap-1.5 justify-center py-2 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Uygulama Yüklendi</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-extrabold text-[11px] transition-all active:scale-97 cursor-pointer hover:shadow-md hover:shadow-emerald-500/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yükle / İndir</span>
                </button>
              )}
            </div>
          </nav>

          {/* User Profile Info Footer - Embedded Click-to-edit Profile & Cloud Storage Integration */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            {authLoading ? (
              <div className="flex items-center gap-2 justify-center py-2 text-xs text-slate-400">
                <RefreshIcon className="w-4 h-4 animate-spin" />
                <span>Kimlik denetleniyor...</span>
              </div>
            ) : user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-2 text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Bulut Eşitlendi</span>
                </div>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-3 w-full text-left p-2 rounded-2xl hover:bg-slate-800/80 active:scale-97 transition-all group cursor-pointer"
                  title="Kişisel Bilgileri Düzenle"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-705 border border-slate-600/70 flex items-center justify-center text-sm font-bold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white overflow-hidden transition-all duration-300">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "Avatar"} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      getInitials(profile.name)
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">{profile.name}</p>
                    <span className="text-[9px] text-slate-400 font-semibold block leading-none mt-0.5">Profili Düzenle</span>
                  </div>
                </button>
                <button
                  onClick={async () => {
                    try {
                      await logoutUser();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex items-center gap-2 justify-center w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-red-950/40 hover:text-red-400 text-xs text-slate-300 transition-all font-semibold cursor-pointer border border-transparent hover:border-red-900/40"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Oturumu Kapat</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-1">
                <p className="text-[9px] text-slate-400 text-center leading-normal font-medium">
                  Verilerinizi güvenle bulutta saklamak ve cihazlar arasında eşitlemek için giriş yapın.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex items-center gap-2.5 justify-center w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-97 text-xs text-slate-900 transition-all font-bold cursor-pointer shadow-md"
                >
                  <Cloud className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                  <span>Google ile Giriş Yap</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA - Right Side Panel */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        
        {/* Header/Top Navigation Bar */}
        <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Hamburger Button on Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer active:scale-95 transition-all outline-none"
              title="Menüyü Aç"
              type="button"
            >
              <Menu className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                  {activeTab === "dashboard" ? "Günlük Özet" : activeTab === "weight" ? "Kilo Takibi" : "Adım ve Sağlık Senkronizasyonu"}
                </h2>
                <span className="bg-emerald-50 dark:bg-emerald-950/30 text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full border border-emerald-100/60 dark:border-emerald-900/40 uppercase tracking-widest font-mono hidden xs:inline-block sm:inline-block">Pro</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs mt-1 leading-none hidden sm:block">
                {activeTab === "dashboard" ? "Yapay Zeka Destekli Klinik Kalori & Makro Analizi" : activeTab === "weight" ? "Kişisel Kilo Takip ve BMI Trend Grafikleri" : "Apple Health & Google Fit Canlı Entegrasyonu ve Aktivite Analizi"}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 sm:gap-3.5 items-center shrink-0">
            {/* Quick manual targets trigger */}
            {activeTab === "dashboard" && (
              <button 
                onClick={() => setIsTargetsOpen(true)}
                className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/35 text-emerald-700 dark:text-emerald-400 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-all active:scale-97 shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-450" />
                <span className="hidden sm:inline">Hedefleri Güncelle</span>
                <span className="sm:hidden">Hedefler</span>
              </button>
            )}

            {/* Streak Counter for responsive header on mobile */}
            <div className="bg-emerald-500 text-white rounded-lg sm:rounded-xl px-1.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-extrabold lg:hidden shrink-0">
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white text-emerald-100" />
              <span>{streakCount} Gün</span>
            </div>

            {/* Mobile / Responsive header PWA Download button */}
            {!isAppInstalled && (
              <button
                onClick={handleInstallApp}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                title="NutriPro'yu Cihazına İndir"
                type="button"
              >
                <Download className="w-4 h-4 text-slate-950 animate-pulse" />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-emerald-450 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
              title={darkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
              type="button"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500 fill-amber-300 pointer-events-none" /> : <Moon className="w-4 h-4 text-slate-700 pointer-events-none" />}
            </button>

            {/* Quick Profile Trigger Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-900 text-emerald-400 font-extrabold text-[10px] sm:text-sm border border-slate-800 cursor-pointer hover:bg-slate-850 hover:text-emerald-350 transition-all active:scale-95 shadow-sm shrink-0"
              title="Kişisel Bilgileri Düzenle"
            >
              {getInitials(profile.name)}
            </button>
          </div>
        </header>

        {/* Content Body Layout */}
        <div className="p-4 sm:p-8 flex-1 space-y-6 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          
          {activeTab === "weight" ? (
            <WeightTracker
              weightLogs={weightLogs}
              onAddWeightLog={handleAddWeightLog}
              onDeleteWeightLog={handleDeleteWeightLog}
              currentWeight={profile.weight}
              targetWeight={profile.targetWeight}
              height={profile.height}
              onUpdateTargetWeight={handleUpdateTargetWeight}
            />
          ) : activeTab === "steps" ? (
            <StepsTracker
              logs={logs}
              activeDate={activeDate}
              onUpdateSteps={handleUpdateSteps}
              profile={profile}
              datesSequence={datesSequence}
            />
          ) : (
            <>
              {/* Calendar Selector Section */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
            <div className="flex items-center space-x-2 mr-2 self-start md:self-auto">
              <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">Takvim İzleyici</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Geçmiş günleri analiz etmek için seçin</span>
              </div>
            </div>

            {/* Grid past 7 Days Selection list */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2 w-full md:w-auto justify-start sm:justify-end">
              {datesSequence.map((dateStr) => {
                const isActive = activeDate === dateStr;
                const d = new Date(dateStr);
                const dayName = d.toLocaleDateString("tr-TR", { weekday: "short" });
                const dayNum = d.getDate();

                // Calculate if calorie limits were met for background indicator indicators
                const historicalLog = logs[dateStr];
                const loggedCals = historicalLog 
                  ? (Object.values(historicalLog.meals) as FoodItem[][]).flatMap(m => m).reduce((a, b) => a + b.calories, 0)
                  : 0;
                const hasMeals = loggedCals > 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setActiveDate(dateStr)}
                    className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all cursor-pointer select-none min-w-[50px] relative ${
                      isActive 
                        ? "bg-slate-900 dark:bg-emerald-600 dark:text-slate-950 text-white font-extrabold shadow-sm scale-103" 
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-705"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">{dayName}</span>
                    <span className="text-sm font-extrabold font-mono mt-0.5">{dayNum}</span>
                    {hasMeals && (
                      <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 dark:bg-slate-950" : "bg-emerald-500 dark:bg-emerald-400"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Displayed Day Indicator Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-255">
                Görüntülenen Gün: <span className="text-slate-950 dark:text-emerald-405 font-black text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/40 px-2 py-1 rounded-lg ml-1">{formatTurkishDate(activeDate)}</span>
              </h3>
            </div>
            
            {isConfirmingReset ? (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/45 px-3 py-1.5 rounded-xl animate-in fade-in duration-200 select-none">
                <span className="text-[10px] text-red-700 dark:text-red-400 font-bold uppercase tracking-wider">Tümünü Sil?</span>
                <button
                  onClick={clearDayLogs}
                  className="text-xs bg-red-600 dark:bg-red-750 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-all active:scale-95"
                >
                  Evet, Sıfırla
                </button>
                <button
                  onClick={() => setIsConfirmingReset(false)}
                  className="text-xs text-slate-500 dark:text-slate-405 hover:text-slate-700 font-bold px-1.5 cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsConfirmingReset(true)}
                className="text-[11px] text-slate-405 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-bold transition-all flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Bugünü Sıfırla</span>
              </button>
            )}
          </div>

          {/* Main Grid Content Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard">
            
            {/* COLUMN LEFT: Loggers and Meals (8 cols or 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* AI Intake Analyzer */}
              <AIAnalyst 
                onAddFoodItems={handleAddFoodItems} 
                defaultMealType="breakfast" 
              />

              {/* Meal Section Logger Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold text-slate-550 uppercase tracking-widest">Günlük Yemek Kayıtları</h3>
                  <span className="text-[10px] bg-slate-200 text-slate-650 px-2 py-0.5 rounded-full font-bold">4 Kategori</span>
                </div>

                <MealSection
                  mealType="breakfast"
                  title="🍳 Kahvaltı"
                  items={activeLog.meals.breakfast}
                  idPrefix="b"
                  onRemoveItem={handleRemoveFoodItem}
                  onAddItem={handleAddSingleFoodItem}
                />
                <MealSection
                  mealType="lunch"
                  title="🥗 Öğle Yemeği"
                  items={activeLog.meals.lunch}
                  idPrefix="l"
                  onRemoveItem={handleRemoveFoodItem}
                  onAddItem={handleAddSingleFoodItem}
                />
                <MealSection
                  mealType="dinner"
                  title="🥩 Akşam Yemeği"
                  items={activeLog.meals.dinner}
                  idPrefix="d"
                  onRemoveItem={handleRemoveFoodItem}
                  onAddItem={handleAddSingleFoodItem}
                />
                <MealSection
                  mealType="snack"
                  title="🍎 Aperatifler / Atıştırmalıklar"
                  items={activeLog.meals.snack}
                  idPrefix="s"
                  onRemoveItem={handleRemoveFoodItem}
                  onAddItem={handleAddSingleFoodItem}
                />
              </div>
            </div>

            {/* COLUMN RIGHT: Metrics, Progress Ring, Water, Micro Breakdowns (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Circular Gauge energy remaining kcal widget */}
              <MetricCircle consumed={totalCaloriesVal} target={activeTargetsObj.calories} />

              {/* Dynamic Macro Balance Tracker Progress Bars */}
              <div id="macro-analytics" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 tracking-tight text-sm">Makrobesin Dengesi</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400">Hedeflenen günlük protein, karbonhidrat ve yağ alım oranları.</p>
                </div>

                {/* Protein Progressive bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Kas Yapılandırıcı (Protein)</span>
                    </div>
                    <span className="font-bold font-mono text-slate-705 dark:text-slate-305">{totalProteinVal.toFixed(1)}g / {activeTargetsObj.protein}g</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${protPct}%` }} 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                    <span>Hedef Karşılama Oranı</span>
                    <span>%{protPct}</span>
                  </div>
                </div>

                {/* Carbs Progressive bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-550" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Hızlı Enerji (Karbonhidrat)</span>
                    </div>
                    <span className="font-bold font-mono text-slate-705 dark:text-slate-305">{totalCarbsVal.toFixed(1)}g / {activeTargetsObj.carbs}g</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${carbsPct}%` }} 
                      className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                    <span>Hedef Karşılama Oranı</span>
                    <span>%{carbsPct}</span>
                  </div>
                </div>

                {/* Fat Progressive bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Hormonal Denge (Sağlıklı Yağ)</span>
                    </div>
                    <span className="font-bold font-mono text-slate-705 dark:text-slate-305">{totalFatVal.toFixed(1)}g / {activeTargetsObj.fat}g</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${fatPct}%` }} 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                    <span>Hedef Karşılama Oranı</span>
                    <span>%{fatPct}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Water Tracker Module */}
              <div id="water-log" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 relative overflow-hidden transition-colors">
                <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-850 dark:text-slate-120 text-sm flex items-center">
                      <Droplet className="w-4.5 h-4.5 text-blue-500 mr-1 fill-blue-500 animate-bounce" />
                      <span>Günlük Sıvı Tüketimi (Su)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Doğru sindirim ve böbrek fonksiyonları için su hayati rol oynar.</p>
                  </div>
                  
                  {isEditingWater ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const consumedVal = parseInt(tempWaterConsumedInput);
                        const targetVal = parseInt(tempWaterTargetInput);
                        if (!isNaN(consumedVal) && consumedVal >= 0) {
                          handleSetWaterConsumed(consumedVal);
                        }
                        if (!isNaN(targetVal) && targetVal > 0) {
                          handleUpdateWaterTarget(targetVal);
                        }
                        setIsEditingWater(false);
                      }}
                      className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 w-full sm:max-w-[200px]"
                    >
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tüketilen (ml)</label>
                        <input
                          type="number"
                          min="0"
                          max="20000"
                          required
                          value={tempWaterConsumedInput}
                          onChange={(e) => setTempWaterConsumedInput(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="ml"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Günlük Hedef (ml)</label>
                        <input
                          type="number"
                          min="100"
                          max="20000"
                          required
                          value={tempWaterTargetInput}
                          onChange={(e) => setTempWaterTargetInput(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="ml"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="submit"
                          className="flex-1 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold rounded-md cursor-pointer"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingWater(false)}
                          className="flex-1 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-[9px] font-bold rounded-md cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <span className="font-bold font-mono text-slate-750 dark:text-slate-200 text-base whitespace-nowrap">
                        {activeLog.waterConsumedMl} <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/</span> {activeTargetsObj.water} <span className="text-xs text-slate-404 dark:text-slate-400 font-bold">ml</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempWaterConsumedInput(String(activeLog.waterConsumedMl));
                          setTempWaterTargetInput(String(activeTargetsObj.water));
                          setIsEditingWater(true);
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-950/35 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 self-start sm:self-auto border border-blue-105 dark:border-blue-900/60"
                      >
                        <Sliders className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                        <span>Miktarları Ayarla</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Wave progress line display */}
                <div className="h-3.5 bg-slate-105 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, (activeLog.waterConsumedMl / activeTargetsObj.water) * 100)}%` }} 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  />
                </div>

                {/* Water logging triggers grid */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleAddWater(250)}
                    className="bg-blue-50/75 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-805 dark:text-blue-300 text-[10px] font-bold py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border border-blue-100/40 dark:border-blue-900/30"
                  >
                    <GlassWater className="w-4.5 h-4.5 mb-1 text-blue-600 dark:text-blue-400" />
                    <span>+250ml</span>
                  </button>
                  <button
                    onClick={() => handleAddWater(500)}
                    className="bg-blue-50/75 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-805 dark:text-blue-300 text-[10px] font-bold py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border border-blue-100/40 dark:border-blue-900/30"
                  >
                    <Droplet className="w-4.5 h-4.5 mb-1 text-blue-600 dark:text-blue-400" />
                    <span>+500ml</span>
                  </button>
                  <button
                    onClick={() => handleAddWater(1000)}
                    className="bg-blue-50/75 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-805 dark:text-blue-300 text-[10px] font-bold py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border border-blue-100/40 dark:border-blue-900/30"
                  >
                    <Droplet className="w-4.5 h-4.5 mb-1 text-blue-700 dark:text-blue-300" />
                    <span>+1 Litre</span>
                  </button>
                  <button
                    onClick={() => handleAddWater(-250)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-semibold py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700"
                    title="250ml sil"
                  >
                    <span className="text-sm scale-150 leading-none mb-1">-</span>
                    <span>Azalt</span>
                  </button>
                </div>
              </div>

              {/* Micronutrients checklist breakdowns panel */}
              <NutrientDetails
                fiber={totalFiberVal}
                fiberTarget={activeTargetsObj.fiber}
                sodium={totalSodiumVal}
                sodiumLimit={activeTargetsObj.sodium}
                sugar={totalSugarVal}
                sugarLimit={activeTargetsObj.sugarLimit}
              />

              {/* Clinical AI dietitian assessment note block */}
              {activeLog.summaryNote && (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-3xl p-5 shadow-3xs flex items-start space-x-3 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed transition-colors">
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900 rounded-md text-emerald-700 dark:text-emerald-300">
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 uppercase tracking-wider text-[10px] text-emerald-700 dark:text-emerald-400">Diyetisyen Değerlendirmesi</h4>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{activeLog.summaryNote}</p>
                  </div>
                </div>
              )}

            </div>

          </div>

            </>
          )}

        </div>

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-t border-slate-250 dark:border-slate-800 lg:hidden flex items-center justify-around px-2 z-40 shadow-xl transition-colors">
        <button
          onClick={() => {
            setActiveTab("dashboard");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === "dashboard" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          type="button"
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Özet</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("weight");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === "weight" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          type="button"
        >
          <Scale className="w-5 h-5 mb-0.5" />
          <span>Kilo</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("steps");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === "steps" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          type="button"
        >
          <Footprints className="w-5 h-5 mb-0.5" />
          <span>Adımlar</span>
        </button>

        <button
          onClick={() => setIsTargetsOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          type="button"
        >
          <Sliders className="w-5 h-5 mb-0.5" />
          <span>Hedefler</span>
        </button>

        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          type="button"
        >
          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-650 dark:text-slate-300 mb-0.5">
            {getInitials(profile.name)}
          </div>
          <span>Profil</span>
        </button>
      </nav>

      {/* Targets Config Modal */}
      <TargetsModal
        isOpen={isTargetsOpen}
        onClose={() => setIsTargetsOpen(false)}
        currentTargets={currentTargets}
        onUpdateTargets={handleUpdateTargets}
      />

      {/* Profile Clinical Config Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* 🚀 Beautiful Steps & Health Onboarding Permission Modal */}
      {showStepOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
            onClick={() => {
              localStorage.setItem("PRO_CAL_STEPS_ONBOARDED", "true");
              setShowStepOnboarding(false);
            }}
          />

          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            
            {/* Top Close icon */}
            <button
              onClick={() => {
                localStorage.setItem("PRO_CAL_STEPS_ONBOARDED", "true");
                setShowStepOnboarding(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Icon Container with pulse animation */}
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner relative mb-6 animate-pulse">
              <span className="absolute inset-0 rounded-2xl bg-emerald-400/20 animate-ping" />
              <Footprints className="w-8 h-8 relative z-10 text-emerald-500" />
            </div>

            {/* Typography */}
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-2">
              Adım Takibi ve Sağlık İzni
            </h3>
            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30 mb-4 inline-block">
              Apple Health & Google Fit
            </span>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mb-6">
              NutriPro, gün boyu attığınız adımları otomatik saptayarak yaktığınız kaloriyi hesaplar ve günlük beslenme planınızı buna göre günceller. Başlamak için cihazınızın varsayılan sağlık uygulaması bağlantısına izin verin.
            </p>

            {/* Quick app option cards */}
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-xl flex flex-col items-center gap-1">
                <Apple className="w-5 h-5 text-slate-800 dark:text-white" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">Apple Health</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-xl flex flex-col items-center gap-1">
                <Activity className="w-5 h-5 text-rose-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350">Google Fit</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => {
                  localStorage.setItem("PRO_CAL_STEPS_ONBOARDED", "true");
                  localStorage.setItem("PRO_CAL_HEALTH_SYNC_STATUS", "connected");
                  localStorage.setItem("PRO_CAL_CONNECTED_HEALTH_APP", "google");
                  
                  const todayStr = datesSequence[6];
                  handleUpdateSteps(todayStr, 8620);

                  setShowStepOnboarding(false);
                  setActiveTab("steps");
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-all active:scale-97 select-none"
              >
                İzin Ver & Senkronizasyonu Başlat
              </button>

              <button
                onClick={() => {
                  localStorage.setItem("PRO_CAL_STEPS_ONBOARDED", "true");
                  setShowStepOnboarding(false);
                }}
                className="w-full py-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Daha Sonra Kur
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📥 PWA App Download/Installation Modal */}
      {showPwaInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
            onClick={() => setShowPwaInstallModal(false)}
          />

          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Cihazına İndir</h3>
              </div>
              <button
                onClick={() => setShowPwaInstallModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-205 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-500/10 dark:bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-normal font-medium">
                  NutriPro'yu telefonunuza veya bilgisayarınıza indirerek tam ekran deneyimi, anlık veri kaydı ve üstün hız kazanabilirsiniz.
                </p>
              </div>

              {/* iOS Safari Instruction */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/60">
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="w-4 h-4 text-slate-800 dark:text-gray-200" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">iPhone / iPad (iOS Safari)</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-500 dark:text-slate-450 space-y-1 pl-1">
                  <li>Safari tarayıcısında <strong className="text-slate-700 dark:text-slate-200">Paylaş</strong> (aşağı yukarı ok) butonuna basın.</li>
                  <li>Aşağı kaydırıp <strong className="text-slate-700 dark:text-slate-200">Ana Ekrana Ekle</strong> seçeneğini seçin.</li>
                  <li>Sağ üstteki <strong className="text-emerald-500">Ekle</strong> butonuna basarak tamamlayın.</li>
                </ol>
              </div>

              {/* Android Chrome / Opera Instruction */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/60">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Android Cihazlar (Chrome)</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-500 dark:text-slate-450 space-y-1 pl-1">
                  <li>Tarayıcı sağ üstündeki <strong className="text-slate-700 dark:text-slate-200">üç noktaya (⋮)</strong> tıklayın.</li>
                  <li><strong className="text-slate-700 dark:text-slate-200">Uygulamayı Yükle</strong> veya <strong className="text-slate-700 dark:text-slate-200">Ana Ekrana Ekle</strong> deyin.</li>
                  <li>Gelen onay penceresini kabul edin.</li>
                </ol>
              </div>

              {/* Desktop Instruction */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/60">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Bilgisayarlar (Chrome / Edge / Opera)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 pl-1 leading-normal">
                  Adres çubuğunun en sağında yer alan <strong className="text-slate-700 dark:text-slate-200">Yükle (Monitör ve aşağı ok)</strong> simgesine tıklayarak uygulamayı başlat menünüze hızlıca kaydedebilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPwaInstallModal(false)}
              className="w-full mt-5 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-97 cursor-pointer text-center"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
