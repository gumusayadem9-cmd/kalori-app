import { DailyTargets, DayLog, FoodItem, MealType } from "../types";

// Helper to calculate default targets based on calorie goals
export function calculateDefaultMacros(calories: number): DailyTargets {
  // Balanced Diet: Carb 45%, Protein 30%, Fat 25%
  // 1g Carb = 4 kcal, 1g Protein = 4 kcal, 1g Fat = 9 kcal
  const carbGrams = Math.round((calories * 0.45) / 4);
  const proteinGrams = Math.round((calories * 0.30) / 4);
  const fatGrams = Math.round((calories * 0.25) / 9);
  
  return {
    calories,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
    water: 2500, // 2.5 Liters default
    fiber: 25,   // 25g default
    sodium: 2300, // 2300mg WHO limit
    sugarLimit: 50, // 50g WHO daily limit
  };
}

// Generate past dates sequence
export function getPastDates(count: number = 7): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    dates.push(`${yr}-${mo}-${dy}`);
  }
  return dates;
}

// Format date into human readable Turkish format e.g. "Bugün", "Dün", "21 Haziran Cuma"
export function formatTurkishDate(dateStr: string): string {
  const todayObj = new Date();
  const today = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

  if (dateStr === today) {
    return "Bugün";
  } else if (dateStr === yesterdayStr) {
    return "Dün";
  }

  const parts = dateStr.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
  return formatter.format(date);
}

// Mock initial data to populate the calorie tracker so it looks incredibly professional and ready
export function getMockHistoryLogs(): DayLog[] {
  const dates = getPastDates(7);
  const today = dates[6];
  const yesterday = dates[5];
  const twoDaysAgo = dates[4];

  const defaultTargets = calculateDefaultMacros(2000);

  return [
    {
      date: twoDaysAgo,
      waterConsumedMl: 2250,
      dailyTargets: defaultTargets,
      meals: {
        breakfast: [
          {
            id: "b1",
            name: "Yulaflı Meyveli Kase",
            portion: "1 orta boy kase (70g yulaf, muz, çilek)",
            calories: 380,
            protein: 12,
            carbs: 65,
            fat: 8,
            fiber: 9.5,
            sodium: 15,
            sugar: 18,
          },
          {
            id: "b2",
            name: "Haşlanmış Yumurta",
            portion: "2 adet (büyük boy)",
            calories: 140,
            protein: 13,
            carbs: 1,
            fat: 10,
            fiber: 0,
            sodium: 124,
            sugar: 0.5,
          }
        ],
        lunch: [
          {
            id: "l1",
            name: "Izgara Tavuklu Salata",
            portion: "1 büyük porsiyon (150g tavuk göğsü, yeşillik, zeytinyağı)",
            calories: 450,
            protein: 38,
            carbs: 12,
            fat: 22,
            fiber: 4.8,
            sodium: 480,
            sugar: 2,
          }
        ],
        dinner: [
          {
            id: "d1",
            name: "Kıymalı Mercimek Yemeği",
            portion: "1.5 kepçe (yaklaşık 200g)",
            calories: 320,
            protein: 18,
            carbs: 28,
            fat: 14,
            fiber: 8,
            sodium: 350,
            sugar: 1,
          },
          {
            id: "d2",
            name: "Süzme Yoğurt",
            portion: "3 yemek kaşığı (150g)",
            calories: 135,
            protein: 9,
            carbs: 6,
            fat: 7,
            fiber: 0,
            sodium: 65,
            sugar: 4,
          }
        ],
        snack: [
          {
            id: "s1",
            name: "Çiğ Badem ve Türk Kahvesi",
            portion: "1 avuç çiğ badem (25g)",
            calories: 145,
            protein: 5.2,
            carbs: 5,
            fat: 12.5,
            fiber: 3.1,
            sodium: 2,
            sugar: 1.1,
          }
        ]
      },
      summaryNote: "Dengeli bir gün geçirdiniz. Lif oranınız yüksek, sodyum ve şeker tüketiminiz oldukça sağlıklı seviyelerde."
    },
    {
      date: yesterday,
      waterConsumedMl: 2500,
      dailyTargets: defaultTargets,
      meals: {
        breakfast: [
          {
            id: "b3",
            name: "Ezine Peynirli Omlet & Simit",
            portion: "2 yumurtalı omlet + yarım sokak simidi",
            calories: 460,
            protein: 21,
            carbs: 45,
            fat: 18,
            fiber: 2.2,
            sodium: 710,
            sugar: 3.5,
          }
        ],
        lunch: [
          {
            id: "l2",
            name: "Etli Kuru Fasulye ve Pirinç Pilavı",
            portion: "1 tabak kuru fasulye + 4 kaşık pilav",
            calories: 590,
            protein: 26,
            carbs: 72,
            fat: 15,
            fiber: 14,
            sodium: 890,
            sugar: 4,
          }
        ],
        dinner: [
          {
            id: "d3",
            name: "Fırında Levrek ve Akdeniz Salatası",
            portion: "1 adet fırınlanmış orta boy levrek + salata",
            calories: 380,
            protein: 34,
            carbs: 10,
            fat: 14,
            fiber: 4,
            sodium: 310,
            sugar: 1.5,
          }
        ],
        snack: [
          {
            id: "s2",
            name: "Yeşil Elma",
            portion: "1 orta boy elma (150g)",
            calories: 80,
            protein: 0.5,
            carbs: 21,
            fat: 0.2,
            fiber: 4.4,
            sodium: 1,
            sugar: 15,
          }
        ]
      },
      summaryNote: "Proteini yüksek bir gündü. Kuru fasulye lif alımınızı harika destekledi. Akşam hafif geçerek sistemi dinlendirdiniz."
    },
    {
      date: today,
      waterConsumedMl: 1000, // partial water for today
      dailyTargets: defaultTargets,
      meals: {
        breakfast: [
          {
            id: "b10",
            name: "Klasik Türk Kahvaltı Tabağı",
            portion: "2 dilim süzme peynir, 5 zeytin, çeri domates, salatalık, haşlanmış yumurta",
            calories: 280,
            protein: 16,
            carbs: 8,
            fat: 18,
            fiber: 2,
            sodium: 540,
            sugar: 2,
          }
        ],
        lunch: [],
        dinner: [],
        snack: []
      }
    }
  ];
}

// Predefined quick-add foods
export interface PredefinedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  portion: string;
  category: string;
}

export const QUICK_ADD_FOODS: PredefinedFood[] = [
  { name: "Haşlanmış Yumurta (Büyük)", calories: 70, protein: 6.5, carbs: 0.5, fat: 5, fiber: 0, sodium: 62, sugar: 0.2, portion: "1 Adet", category: "Kahvaltılık" },
  { name: "Süzme Ezine Peyniri", calories: 95, protein: 5.5, carbs: 0.8, fat: 7.5, fiber: 0, sodium: 220, sugar: 0.5, portion: "1 Dilim (30g)", category: "Kahvaltılık" },
  { name: "Siyah Zeytin (Ege)", calories: 45, protein: 0.4, carbs: 0.3, fat: 4.5, fiber: 0.5, sodium: 180, sugar: 0.1, portion: "5 Adet (15g)", category: "Kahvaltılık" },
  { name: "Tam Buğday Ekmeği", calories: 65, protein: 2.5, carbs: 12, fat: 0.8, fiber: 1.8, sodium: 110, sugar: 0.6, portion: "1 Dilim (25g)", category: "Ekmek-Tahıl" },
  { name: "Muz (Yerli)", calories: 105, protein: 1.2, carbs: 27, fat: 0.3, fiber: 3, sodium: 1, sugar: 14, portion: "1 Orta Boy (120g)", category: "Meyve" },
  { name: "Çiğ Badem", calories: 145, protein: 5.2, carbs: 5, fat: 12.5, fiber: 3.1, sodium: 2, sugar: 1.1, portion: "1 Avuç (25g)", category: "Atıştırmalık" },
  { name: "Izgara Tavuk Göğsü", calories: 247, protein: 46, carbs: 0, fat: 5.5, fiber: 0, sodium: 430, sugar: 0, portion: "1 Porsiyon (150g)", category: "Protein/Et" },
  { name: "Yeşil Mercimek Yemeği", calories: 210, protein: 13, carbs: 28, fat: 3.5, fiber: 9, sodium: 240, sugar: 1.2, portion: "1 Kepçe (150g)", category: "Ev Yemekleri" },
  { name: "Yoğurt (Yarım Yağlı)", calories: 90, protein: 5.2, carbs: 7.0, fat: 3.8, fiber: 0, sodium: 75, sugar: 4.8, portion: "1 Kase (150g)", category: "Süt-Yoğurt" },
  { name: "Türk Kahvesi (Şekersiz)", calories: 2, protein: 0.1, carbs: 0.1, fat: 0.1, fiber: 0, sodium: 1, sugar: 0, portion: "1 Fincan", category: "İçecek" },
  { name: "Siyah Çay (Şekersiz)", calories: 1, protein: 0, carbs: 0.1, fat: 0, fiber: 0, sodium: 0.1, sugar: 0, portion: "1 Bardak", category: "İçecek" }
];
