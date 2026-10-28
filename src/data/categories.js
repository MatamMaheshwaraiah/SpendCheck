// System categories. Mirrors the `categories` MySQL table (kind, bucket, icon, color).
export const CATEGORIES = [
  { id: 1, name: "Rent & Housing", kind: "expense", bucket: "need", icon: "Home", color: "#4a5fd6" },
  { id: 2, name: "Groceries", kind: "expense", bucket: "need", icon: "ShoppingBasket", color: "#2f8f9d" },
  { id: 3, name: "Utilities & Bills", kind: "expense", bucket: "need", icon: "Zap", color: "#6b7bd8" },
  { id: 4, name: "Transport & Fuel", kind: "expense", bucket: "need", icon: "Car", color: "#5d6c8f" },
  { id: 5, name: "Health & Pharmacy", kind: "expense", bucket: "need", icon: "HeartPulse", color: "#1f9c8c" },
  { id: 6, name: "Education", kind: "expense", bucket: "need", icon: "GraduationCap", color: "#8a6fd1" },
  { id: 7, name: "Food Delivery", kind: "expense", bucket: "want", icon: "Bike", color: "#e0568f" },
  { id: 8, name: "Dining Out", kind: "expense", bucket: "want", icon: "UtensilsCrossed", color: "#e07a4f" },
  { id: 9, name: "Shopping", kind: "expense", bucket: "want", icon: "ShoppingBag", color: "#c94fa6" },
  { id: 10, name: "Entertainment & OTT", kind: "expense", bucket: "want", icon: "Clapperboard", color: "#9b5bd6" },
  { id: 11, name: "Travel", kind: "expense", bucket: "want", icon: "Plane", color: "#d9a21b" },
  { id: 12, name: "Investments & SIP", kind: "expense", bucket: "savings", icon: "TrendingUp", color: "#0c8a7b" },
  { id: 13, name: "Salary", kind: "income", bucket: "none", icon: "Wallet", color: "#12875a" },
  { id: 14, name: "Other Income", kind: "income", bucket: "none", icon: "PiggyBank", color: "#2fbfac" },
  { id: 15, name: "Miscellaneous", kind: "expense", bucket: "want", icon: "CircleDashed", color: "#8a8fa3" },
];

export const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const BUCKETS = {
  need: { label: "Needs", color: "var(--color-need)", hex: "var(--color-need)", target: 50 },
  want: { label: "Wants", color: "var(--color-want)", hex: "var(--color-want)", target: 30 },
  savings: { label: "Savings", color: "var(--color-save)", hex: "var(--color-save)", target: 20 },
};

/* Stage-2 of the categorisation cascade: Indian merchant dictionary.
   (Stage 1 = user rules, Stage 3 = kNN on history, Stage 4 = LLM fallback — server side.) */
const DICTIONARY = [
  [/swiggy|zomato|eatsure|dominos|domino's|pizza ?hut|kfc|mcdonald/i, 7, 0.96],
  [/bigbasket|blinkit|zepto|instamart|dmart|jiomart|more retail|ratnadeep|kirana|grocer/i, 2, 0.95],
  [/irctc|uber|ola|rapido|metro|redbus|indian ?oil|iocl|hpcl|bpcl|petrol|fuel|fastag/i, 4, 0.93],
  [/airtel|jio|vi |vodafone|bescom|tsspdcl|electric|water board|gas|act fibernet|broadband|recharge/i, 3, 0.94],
  [/netflix|prime video|hotstar|spotify|youtube premium|bookmyshow|pvr|inox|sonyliv|zee5/i, 10, 0.97],
  [/amazon|flipkart|myntra|ajio|nykaa|meesho|croma|reliance digital|decathlon/i, 9, 0.88],
  [/apollo|medplus|pharmeasy|1mg|netmeds|hospital|clinic|diagnostic/i, 5, 0.93],
  [/rent|nobroker|housing|society maint|maintenance/i, 1, 0.9],
  [/zerodha|groww|upstox|sip|mutual fund|nach.*mf|ppf|recurring deposit|\brd\b|fixed deposit/i, 12, 0.95],
  [/makemytrip|goibibo|indigo|air india|vistara|akasa|oyo|cleartrip|ixigo/i, 11, 0.92],
  [/udemy|coursera|byju|unacademy|college fee|tuition|exam fee/i, 6, 0.92],
  [/cafe|restaurant|barbeque|biryani|bistro|starbucks|chai|bar & grill|paradise/i, 8, 0.86],
  [/salary|sal cr|payroll/i, 13, 0.98],
];

/** Returns { categoryId, bucket, confidence, classifiedBy } */
export function categorize(description = "", userRules = []) {
  for (const r of userRules) {
    if (description.toLowerCase().includes(r.pattern.toLowerCase()))
      return { categoryId: r.categoryId, bucket: catById[r.categoryId].bucket, confidence: 0.99, classifiedBy: "rule" };
  }
  for (const [re, id, conf] of DICTIONARY) {
    if (re.test(description)) return { categoryId: id, bucket: catById[id].bucket, confidence: conf, classifiedBy: "dictionary" };
  }
  return { categoryId: 15, bucket: "want", confidence: 0.42, classifiedBy: "llm" };
}
