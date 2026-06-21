export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number; // mg
  sugar: number; // g
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealTypeMeta {
  type: MealType;
  label: string;
  iconName: string;
  recommendedPercent: number; // percentage of daily calories
}

export interface DailyTargets {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  water: number; // ml
  fiber: number; // g
  sodium: number; // mg
  sugarLimit: number; // g
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast: FoodItem[];
    lunch: FoodItem[];
    dinner: FoodItem[];
    snack: FoodItem[];
  };
  waterConsumedMl: number;
  dailyTargets: DailyTargets;
  summaryNote?: string; // dietitian note for this day
  steps?: number; // steps walked
}

export interface AnalysisResponseData {
  items: Omit<FoodItem, "id">[];
  summary: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
