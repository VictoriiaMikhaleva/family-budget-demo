import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Filter,
  LineChart,
  Archive,
  PiggyBank,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  X,
  Pencil,
  Save,
  Sun,
  Moon,
} from "lucide-react";
import {
  getCloudRevision,
  listenBudgetFromCloud,
  saveBudgetToCloud,
} from "./firebase";

function publicAsset(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

const FAMILY_MEMBERS = [
  { id: "member1", name: "Сима", photo: publicAsset("avatars/member-1.png") },
  { id: "member2", name: "Рыжик", photo: publicAsset("avatars/member-2.png") },
  { id: "member3", name: "Умка", photo: publicAsset("avatars/member-3.png") },
  { id: "member4", name: "Плюша", photo: publicAsset("avatars/member-4.png") },
  { id: "member5", name: "Снежок", photo: publicAsset("avatars/member-5.png") },
];

const MEMBER_OPTIONS = [{ id: "all", name: "Все" }, ...FAMILY_MEMBERS];

const EXPENSE_CATEGORIES = [
  "Еда",
  "Вещи",
  "Кафе",
  "Развлечения",
  "Транспорт",
  "Дом",
  "Здоровье",
  "Образование",
  "Подарки",
  "Родители",
  "Дни Рождения",
  "Путешествия",
  "Связь",
  "Красота",
  "Другое",
  "Своя статья",
];

const INCOME_CATEGORIES = [
  "Зарплата",
  "Премия",
  "Подработка",
  "Подарок",
  "Кэшбэк",
  "Возврат",
  "Инвестиции",
  "Своя статья",
];

const DEFAULT_LIMITS = {
  "Еда": 0,
  "Вещи": 0,
  "Кафе": 0,
  "Развлечения": 0,
  "Транспорт": 0,
  "Дом": 0,
  "Здоровье": 0,
  "Образование": 0,
  "Подарки": 0,
  "Родители": 0,
  "Дни Рождения": 0,
  "Путешествия": 0,
  "Связь": 0,
  "Красота": 0,
  "Другое": 0,
  "Своя статья": 0,
};

const PIE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#64748b",
  "#14b8a6",
  "#fb7185",
  "#a855f7",
  "#22c55e",
];

function getChartTooltipProps(isDark) {
  return {
    contentStyle: {
      background: isDark ? "#0f172a" : "#ffffff",
      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
      borderRadius: 16,
      color: isDark ? "#f8fafc" : "#0f172a",
    },
    itemStyle: { color: isDark ? "#f8fafc" : "#0f172a" },
    labelStyle: { color: isDark ? "#cbd5e1" : "#475569" },
  };
}

function getChartAxisColor(isDark) {
  return isDark ? "#cbd5e1" : "#475569";
}

function formatChartTooltipValue(value) {
  return [currency.format(value), ""];
}

const STORAGE_KEY = "family-budget-demo-v2";
const THEME_KEY = "family-budget-demo-theme";

function applyThemeToDocument(theme) {
  const isDark = theme === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = isDark ? "dark" : "light";
  localStorage.setItem(THEME_KEY, theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", isDark ? "#020617" : "#f8fafc");
}

const currency = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now() + Math.random());
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date) {
  return String(date || today()).slice(0, 7);
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  return `${month}.${year}`;
}

const MONTH_NAMES_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function formatMonthGroupTitle(key) {
  const [year, month] = String(key || "").split("-");
  const monthIndex = Number(month) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return monthLabel(key);
  return `${MONTH_NAMES_RU[monthIndex]} ${year}`;
}

function getMemberById(memberId) {
  return MEMBER_OPTIONS.find((member) => member.id === memberId) || MEMBER_OPTIONS[0];
}

function getMemberName(memberId) {
  return getMemberById(memberId).name;
}

function getMemberPhoto(memberId) {
  return getMemberById(memberId).photo;
}
function getCategoryLabel(item) {
  if (item.category === "Своя статья") return item.customCategory?.trim() || "Своя статья";
  return item.category;
}

function getDefaultCategory(type) {
  return type === "expense" ? "Еда" : "Зарплата";
}

function sumAmounts(items, condition) {
  return items.reduce((sum, item) => (condition(item) ? sum + Number(item.amount || 0) : sum), 0);
}

function formatDisplayDate(dateStr) {
  const [year, month, day] = String(dateStr || "").split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}.${month}.${year}`;
}

function openNativeDatePicker(inputRef) {
  const input = inputRef.current;
  if (!input) return;
  if (typeof input.showPicker === "function") {
    input.showPicker();
  } else {
    input.click();
  }
}

function syncDateFromIso(iso, setForm, setDateInput) {
  if (!iso) return;
  setForm((prev) => ({ ...prev, date: iso }));
  setDateInput(formatDisplayDate(iso));
}

function parseDisplayDate(value) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null;

  return iso;
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function createDemoTransactions() {
  return [
    { id: "demo-1", type: "income", memberId: "member1", category: "Зарплата", customCategory: "", amount: 92000, date: isoDate(2026, 6, 5), note: "Оклад" },
    { id: "demo-2", type: "income", memberId: "member2", category: "Подработка", customCategory: "", amount: 18000, date: isoDate(2026, 6, 12), note: "Фриланс" },
    { id: "demo-3", type: "income", memberId: "member3", category: "Премия", customCategory: "", amount: 15000, date: isoDate(2026, 5, 28), note: "Квартальная" },
    { id: "demo-4", type: "expense", memberId: "member1", category: "Еда", customCategory: "", amount: 4200, date: isoDate(2026, 6, 18), note: "Супермаркет" },
    { id: "demo-5", type: "expense", memberId: "member2", category: "Кафе", customCategory: "", amount: 890, date: isoDate(2026, 6, 17), note: "Кофе с друзьями" },
    { id: "demo-6", type: "expense", memberId: "member3", category: "Транспорт", customCategory: "", amount: 2500, date: isoDate(2026, 6, 10), note: "Проездной" },
    { id: "demo-7", type: "expense", memberId: "member4", category: "Развлечения", customCategory: "", amount: 3200, date: isoDate(2026, 6, 8), note: "Кино" },
    { id: "demo-8", type: "expense", memberId: "member5", category: "Вещи", customCategory: "", amount: 5600, date: isoDate(2026, 6, 3), note: "Одежда" },
    { id: "demo-9", type: "expense", memberId: "member1", category: "Дом", customCategory: "", amount: 7800, date: isoDate(2026, 5, 25), note: "Коммуналка" },
    { id: "demo-10", type: "expense", memberId: "member2", category: "Еда", customCategory: "", amount: 3100, date: isoDate(2026, 5, 20), note: "Продукты" },
    { id: "demo-11", type: "income", memberId: "member4", category: "Зарплата", customCategory: "", amount: 76000, date: isoDate(2026, 5, 5), note: "Оклад" },
    { id: "demo-12", type: "expense", memberId: "member3", category: "Здоровье", customCategory: "", amount: 2400, date: isoDate(2026, 5, 14), note: "Аптека" },
    { id: "demo-13", type: "expense", memberId: "member5", category: "Еда", customCategory: "", amount: 2800, date: isoDate(2026, 4, 22), note: "Магазин" },
    { id: "demo-14", type: "income", memberId: "member5", category: "Кэшбэк", customCategory: "", amount: 1200, date: isoDate(2026, 4, 18), note: "Банк" },
    { id: "demo-15", type: "expense", memberId: "member1", category: "Путешествия", customCategory: "", amount: 12500, date: isoDate(2026, 4, 10), note: "Билеты" },
    { id: "demo-16", type: "expense", memberId: "member4", category: "Связь", customCategory: "", amount: 900, date: isoDate(2026, 4, 5), note: "Мобильный" },
    { id: "demo-17", type: "income", memberId: "member2", category: "Зарплата", customCategory: "", amount: 68000, date: isoDate(2026, 4, 5), note: "Оклад" },
    { id: "demo-18", type: "expense", memberId: "member2", category: "Красота", customCategory: "", amount: 3500, date: isoDate(2026, 6, 14), note: "Салон" },
  ];
}

function createDemoLimits() {
  return mergeLimits({
    Еда: 25000,
    Кафе: 8000,
    Транспорт: 6000,
    Развлечения: 10000,
    Вещи: 12000,
    Дом: 15000,
    Здоровье: 5000,
    Путешествия: 20000,
    Связь: 3000,
    Красота: 5000,
  });
}

function groupTransactionsByDay(items) {
  const groups = [];

  for (const item of items) {
    const previous = groups[groups.length - 1];
    if (previous && previous.date === item.date) {
      previous.items.push(item);
    } else {
      groups.push({ date: item.date, items: [item] });
    }
  }

  return groups.map((group) => ({
    ...group,
    income: sumAmounts(group.items, (entry) => entry.type === "income"),
    expense: sumAmounts(group.items, (entry) => entry.type === "expense"),
  }));
}

function groupTransactionsByMonth(items) {
  const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  const map = new Map();

  for (const item of sorted) {
    const key = monthKey(item.date);
    if (!map.has(key)) {
      map.set(key, { key, month: monthLabel(key), items: [] });
    }
    map.get(key).items.push(item);
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      title: formatMonthGroupTitle(group.key),
      total: sumAmounts(group.items, () => true),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

function buildMonthSummary(key, monthTransactions) {
  const income = sumAmounts(monthTransactions, (item) => item.type === "income");
  const expense = sumAmounts(monthTransactions, (item) => item.type === "expense");
  const balance = income - expense;
  const savingRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const categoryMap = new Map();
  monthTransactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      const label = getCategoryLabel(item);
      categoryMap.set(label, (categoryMap.get(label) || 0) + Number(item.amount || 0));
    });

  const byCategory = [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byMember = FAMILY_MEMBERS.map((member) => ({
    memberId: member.id,
    name: member.name,
    income: sumAmounts(monthTransactions, (item) => item.memberId === member.id && item.type === "income"),
    expense: sumAmounts(monthTransactions, (item) => item.memberId === member.id && item.type === "expense"),
  }));

  const biggestExpense = byCategory[0] || null;

  return {
    monthKey: key,
    title: formatMonthGroupTitle(key),
    closedAt: today(),
    income,
    expense,
    balance,
    savingRate,
    transactionCount: monthTransactions.length,
    biggestExpense: biggestExpense ? `${biggestExpense.name}: ${currency.format(biggestExpense.value)}` : "—",
    byCategory,
    byMember,
    transactions: monthTransactions,
  };
}

function formatDayTotal(group) {
  const parts = [];

  if (group.income > 0) parts.push(`доходы ${currency.format(group.income)}`);
  if (group.expense > 0) parts.push(`расходы ${currency.format(group.expense)}`);

  const net = group.income - group.expense;
  if (group.income > 0 && group.expense > 0) {
    parts.push(`итого ${currency.format(net)}`);
  }

  if (!parts.length) return "0 ₽";
  return parts.join(" · ");
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyThemeToDocument(next);
      return next;
    });
  }

  return { theme, toggleTheme, isDark: theme === "dark" };
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function mergeLimits(saved) {
  return { ...DEFAULT_LIMITS, ...(saved || {}) };
}

function loadStoredBudget() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        transactions: createDemoTransactions(),
        limits: createDemoLimits(),
        monthSummaries: [],
        revision: 0,
      };
    }

    const parsed = JSON.parse(saved);
    const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    return {
      transactions: transactions.length ? transactions : createDemoTransactions(),
      limits: mergeLimits(parsed.limits),
      monthSummaries: Array.isArray(parsed.monthSummaries) ? parsed.monthSummaries : [],
      revision: typeof parsed.revision === "number" ? parsed.revision : 0,
    };
  } catch {
    return {
      transactions: createDemoTransactions(),
      limits: createDemoLimits(),
      monthSummaries: [],
      revision: 0,
    };
  }
}

export default function App() {
  const initialBudget = loadStoredBudget();
  const cloudLoadedRef = useRef(false);
  const applyingCloudRef = useRef(false);
  const cloudSeedAttemptedRef = useRef(false);
  const hasHydratedFromServerRef = useRef(false);
  const revisionRef = useRef(initialBudget.revision);
  const transactionsRef = useRef(initialBudget.transactions);
  const limitsRef = useRef(initialBudget.limits);
  const monthSummariesRef = useRef(initialBudget.monthSummaries);

  const [transactions, setTransactions] = useState(initialBudget.transactions);
  const [limits, setLimits] = useState(initialBudget.limits);
  const [monthSummaries, setMonthSummaries] = useState(initialBudget.monthSummaries);

  const [filterMember, setFilterMember] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null);
  const [memberDrilldown, setMemberDrilldown] = useState(null);
  const [monthToClose, setMonthToClose] = useState("");
  const [expandedArchiveKey, setExpandedArchiveKey] = useState(null);
  const chartDrilldownRef = useRef(null);
  const mainPanelRef = useRef(null);
  const formPanelRef = useRef(null);
  const amountInputRef = useRef(null);
  const datePickerRef = useRef(null);
  const isCompact = useMediaQuery("(max-width: 639px)");
  const { toggleTheme, isDark } = useTheme();
  const chartTooltipProps = useMemo(() => getChartTooltipProps(isDark), [isDark]);
  const chartAxisColor = getChartAxisColor(isDark);
  const chartGridStroke = isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";
  const chartHeight = isCompact ? 240 : 320;
  const pieOnlyHeight = isCompact ? 220 : 260;
  const categoryBarHeight = isCompact ? 260 : 320;

  useEffect(() => {
    setSelectedExpenseCategory(null);
    setMemberDrilldown(null);
  }, [filterMonth]);

  function openCategoryDrilldown(category) {
    setMemberDrilldown(null);
    setSelectedExpenseCategory((prev) => {
      const next = prev === category ? null : category;
      if (next) {
        requestAnimationFrame(() => {
          chartDrilldownRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
      return next;
    });
  }

  function openMemberDrilldown(memberName, transactionType) {
    const member = FAMILY_MEMBERS.find((item) => item.name === memberName);
    if (!member) return;

    setSelectedExpenseCategory(null);
    setMemberDrilldown((prev) => {
      const isSame = prev?.memberId === member.id && prev?.transactionType === transactionType;
      const next = isSame ? null : { memberId: member.id, transactionType, memberName: member.name };
      if (next) {
        requestAnimationFrame(() => {
          chartDrilldownRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
      return next;
    });
  }

  function clearChartDrilldown() {
    setSelectedExpenseCategory(null);
    setMemberDrilldown(null);
  }

  const [form, setForm] = useState({
    type: "expense",
    memberId: "all",
    category: "Еда",
    customCategory: "",
    amount: "",
    date: today(),
    note: "",
  });
  const [dateInput, setDateInput] = useState(() => formatDisplayDate(today()));

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    limitsRef.current = limits;
  }, [limits]);

  useEffect(() => {
    const allowCacheFallback = setTimeout(() => {
      hasHydratedFromServerRef.current = true;
    }, 4000);

    const unsubscribe = listenBudgetFromCloud(
      (update) => {
        if (!update.exists) {
          cloudLoadedRef.current = true;

          if (!cloudSeedAttemptedRef.current && transactionsRef.current.length > 0) {
            cloudSeedAttemptedRef.current = true;
            saveCurrentBudgetToCloud(transactionsRef.current, limitsRef.current);
          }
          return;
        }

        const cloudRevision = getCloudRevision(update.data);

        if (update.fromCache && cloudRevision < revisionRef.current) {
          return;
        }

        if (cloudRevision < revisionRef.current) {
          return;
        }

        if (!hasHydratedFromServerRef.current && update.fromCache) {
          return;
        }

        if (!update.fromCache) {
          hasHydratedFromServerRef.current = true;
        }

        applyingCloudRef.current = true;

        if (Array.isArray(update.data.transactions)) {
          setTransactions(update.data.transactions);
          transactionsRef.current = update.data.transactions;
        }

        if (update.data.limits) {
          const mergedLimits = mergeLimits(update.data.limits);
          setLimits(mergedLimits);
          limitsRef.current = mergedLimits;
        }

        if (Array.isArray(update.data.monthSummaries)) {
          setMonthSummaries(update.data.monthSummaries);
          monthSummariesRef.current = update.data.monthSummaries;
        }

        revisionRef.current = cloudRevision;
        cloudLoadedRef.current = true;

        requestAnimationFrame(() => {
          applyingCloudRef.current = false;
        });
      },
      (error) => {
        console.error("Ошибка загрузки бюджета:", error);
        cloudLoadedRef.current = true;
        hasHydratedFromServerRef.current = true;
      }
    );

    return () => {
      clearTimeout(allowCacheFallback);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          transactions,
          limits,
          monthSummaries,
          revision: revisionRef.current,
        })
      );
    } catch (error) {
      console.error("Не удалось сохранить в localStorage:", error);
    }
  }, [transactions, limits, monthSummaries]);

  async function saveCurrentBudgetToCloud(
    nextTransactions = transactionsRef.current,
    nextLimits = limitsRef.current,
    nextMonthSummaries = monthSummariesRef.current
  ) {
    const nextRevision = revisionRef.current + 1;
    revisionRef.current = nextRevision;

    try {
      await saveBudgetToCloud({
        transactions: nextTransactions,
        limits: nextLimits,
        monthSummaries: nextMonthSummaries,
        revision: nextRevision,
      });
      return true;
    } catch (error) {
      revisionRef.current = nextRevision - 1;
      console.error("Ошибка сохранения бюджета:", error);
      alert("Не удалось сохранить данные. Попробуйте ещё раз.");
      return false;
    }
  }
  const availableMonths = useMemo(() => {
    const months = [...new Set(transactions.map((item) => monthKey(item.date)))].sort().reverse();
    return months;
  }, [transactions]);

  const closedMonthKeys = useMemo(
    () => new Set(monthSummaries.map((summary) => summary.monthKey)),
    [monthSummaries]
  );

  const closableMonths = useMemo(
    () => availableMonths.filter((key) => !closedMonthKeys.has(key)),
    [availableMonths, closedMonthKeys]
  );

  const effectiveMonthToClose = monthToClose || closableMonths[0] || "";

  const monthClosePreview = useMemo(() => {
    if (!effectiveMonthToClose) return null;
    const monthItems = transactions.filter((item) => monthKey(item.date) === effectiveMonthToClose);
    if (!monthItems.length) return null;
    return buildMonthSummary(effectiveMonthToClose, monthItems);
  }, [effectiveMonthToClose, transactions]);

  const periodTransactions = useMemo(() => {
    if (filterMonth === "all") return transactions;
    return transactions.filter((item) => monthKey(item.date) === filterMonth);
  }, [transactions, filterMonth]);

  const periodLabel = filterMonth === "all" ? null : monthLabel(filterMonth);

  const visibleTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...transactions]
      .filter((item) => (filterMember === "all" ? true : item.memberId === filterMember))
      .filter((item) => (filterType === "all" ? true : item.type === filterType))
      .filter((item) => (filterMonth === "all" ? true : monthKey(item.date) === filterMonth))
      .filter((item) => {
        if (!query) return true;
        const text = [
          item.date,
          item.type === "income" ? "доход" : "расход",
          getMemberName(item.memberId),
          getCategoryLabel(item),
          item.note,
          item.amount,
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterMember, filterType, filterMonth, searchQuery]);

  const historyDayGroups = useMemo(() => groupTransactionsByDay(visibleTransactions), [visibleTransactions]);

  const totalIncome = useMemo(() => sumAmounts(periodTransactions, (item) => item.type === "income"), [periodTransactions]);
  const totalExpense = useMemo(() => sumAmounts(periodTransactions, (item) => item.type === "expense"), [periodTransactions]);
  const balance = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const filteredIncome = useMemo(() => sumAmounts(visibleTransactions, (item) => item.type === "income"), [visibleTransactions]);
  const filteredExpense = useMemo(() => sumAmounts(visibleTransactions, (item) => item.type === "expense"), [visibleTransactions]);
  const averageExpense = useMemo(() => {
    const expenses = periodTransactions.filter((item) => item.type === "expense");
    return expenses.length > 0 ? Math.round(totalExpense / expenses.length) : 0;
  }, [periodTransactions, totalExpense]);

  const expensesByCategory = useMemo(() => {
    const map = new Map();
    periodTransactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const label = getCategoryLabel(item);
        map.set(label, (map.get(label) || 0) + Number(item.amount || 0));
      });

    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodTransactions]);

  const biggestExpense = expensesByCategory[0] || null;

  const selectedCategoryAmount = useMemo(() => {
    if (!selectedExpenseCategory) return 0;
    return expensesByCategory.find((item) => item.name === selectedExpenseCategory)?.value || 0;
  }, [selectedExpenseCategory, expensesByCategory]);

  const categoryLegendPayload = useMemo(
    () =>
      expensesByCategory.map((entry, index) => ({
        value: entry.name,
        color: PIE_COLORS[index % PIE_COLORS.length],
        payload: entry,
      })),
    [expensesByCategory]
  );

  const categoryDetailTransactions = useMemo(() => {
    if (!selectedExpenseCategory) return [];

    return periodTransactions
      .filter((item) => item.type === "expense" && getCategoryLabel(item) === selectedExpenseCategory)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [periodTransactions, selectedExpenseCategory]);

  const memberDrilldownTransactions = useMemo(() => {
    if (!memberDrilldown) return [];

    return periodTransactions
      .filter(
        (item) =>
          item.memberId === memberDrilldown.memberId && item.type === memberDrilldown.transactionType
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [periodTransactions, memberDrilldown]);

  const memberDrilldownTotal = useMemo(
    () => sumAmounts(memberDrilldownTransactions, () => true),
    [memberDrilldownTransactions]
  );

  const memberBarData = useMemo(() => {
    return MEMBER_OPTIONS.map((member) => ({
      name: member.name,
      Доходы: sumAmounts(periodTransactions, (item) => item.memberId === member.id && item.type === "income"),
      Расходы: sumAmounts(periodTransactions, (item) => item.memberId === member.id && item.type === "expense"),
    }));
  }, [periodTransactions]);

  const monthlyData = useMemo(() => {
    const map = new Map();

    transactions.forEach((item) => {
      const key = monthKey(item.date);
      if (!map.has(key)) {
        map.set(key, { key, month: monthLabel(key), Доходы: 0, Расходы: 0, Баланс: 0 });
      }
      const row = map.get(key);
      if (item.type === "income") row["Доходы"] += Number(item.amount || 0);
      if (item.type === "expense") row["Расходы"] += Number(item.amount || 0);
      row["Баланс"] = row["Доходы"] - row["Расходы"];
    });

    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  const limitsMonthKey = filterMonth === "all" ? monthKey(today()) : filterMonth;

  const limitsData = useMemo(() => {
    return Object.entries(limits)
      .map(([category, limit]) => {
        const spent = sumAmounts(
          transactions,
          (item) =>
            item.type === "expense" &&
            getCategoryLabel(item) === category &&
            monthKey(item.date) === limitsMonthKey
        );
        const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        return { category, limit: Number(limit || 0), spent, percent, remaining: Math.max(Number(limit || 0) - spent, 0) };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [limits, transactions, limitsMonthKey]);

  const advice = useMemo(() => {
    const tips = [];
    if (savingRate < 10 && totalIncome > 0) {
      tips.push("Норма накопления ниже 10%. Попробуйте временно снизить траты на кафе, развлечения или вещи.");
    }
    if (biggestExpense) {
      tips.push(`Больше всего денег уходит на «${biggestExpense.name}». Проверьте, можно ли поставить месячный лимит.`);
    }
    const overLimit = limitsData.find((item) => item.percent >= 100);
    if (overLimit) {
      tips.push(`Лимит по статье «${overLimit.category}» уже превышен или достигнут. Новые траты лучше согласовывать отдельно.`);
    }
    if (balance > 0 && savingRate >= 20) {
      tips.push("Баланс выглядит хорошо: можно часть остатка направить в накопления, отпуск или резервный фонд.");
    }
    if (!tips.length) tips.push("Добавьте больше операций, и здесь появятся персональные подсказки по бюджету.");
    return tips;
  }, [savingRate, totalIncome, biggestExpense, limitsData, balance]);

  const selectedMemberPreview = getMemberById(form.memberId);

  function openStatSection(tab, options = {}) {
    setActiveTab(tab);
    if (options.filterType !== undefined) setFilterType(options.filterType);
    if (options.filterMember !== undefined) setFilterMember(options.filterMember);
    if (options.filterMonth !== undefined) setFilterMonth(options.filterMonth);

    requestAnimationFrame(() => {
      mainPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleMemberClick(memberId) {
    setEditingId(null);
    const nextDate = today();
    setDateInput(formatDisplayDate(nextDate));
    setForm((prev) => ({
      ...prev,
      memberId,
      amount: "",
      note: "",
      date: nextDate,
      customCategory: prev.category === "Своя статья" ? "" : prev.customCategory,
    }));

    requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      amountInputRef.current?.focus({ preventScroll: true });
    });
  }

  function resetForm(type = form.type) {
    const nextDate = today();
    setForm({
      type,
      memberId: "all",
      category: getDefaultCategory(type),
      customCategory: "",
      amount: "",
      date: nextDate,
      note: "",
    });
    setDateInput(formatDisplayDate(nextDate));
    setEditingId(null);
  }

  function handleTypeChange(type) {
    setForm((prev) => ({ ...prev, type, category: getDefaultCategory(type), customCategory: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      alert("Введите корректную сумму");
      return;
    }

    if (form.category === "Своя статья" && !form.customCategory.trim()) {
      alert("Введите название своей статьи");
      return;
    }

    const parsedDate = parseDisplayDate(dateInput);
    if (!parsedDate) {
      alert("Введите дату в формате ДД.ММ.ГГГГ");
      return;
    }

    const prepared = {
      id: editingId || createId(),
      type: form.type,
      memberId: form.memberId,
      category: form.category,
      customCategory: form.category === "Своя статья" ? form.customCategory.trim() : "",
      amount,
      date: parsedDate,
      note: form.note.trim(),
    };

    let nextTransactions;

if (editingId) {
  nextTransactions = transactions.map((item) =>
    item.id === editingId ? prepared : item
  );
} else {
  nextTransactions = [prepared, ...transactions];
}

setTransactions(nextTransactions);
transactionsRef.current = nextTransactions;

const saved = await saveCurrentBudgetToCloud(nextTransactions, limitsRef.current);

if (saved) {
  resetForm(form.type);
} else {
  alert("Запись добавлена на экране, но не сохранилась. Не обновляйте страницу.");
}
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      memberId: item.memberId,
      category: item.category,
      customCategory: item.customCategory || "",
      amount: String(item.amount),
      date: item.date,
      note: item.note || "",
    });
    setDateInput(formatDisplayDate(item.date));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    const nextTransactions = transactions.filter((item) => item.id !== id);
    setTransactions(nextTransactions);
    transactionsRef.current = nextTransactions;
    await saveCurrentBudgetToCloud(nextTransactions, limitsRef.current);

    if (editingId === id) resetForm();
  }

  async function handleClearAll() {
    if (window.confirm("Удалить все операции?")) {
      setTransactions([]);
      transactionsRef.current = [];
      await saveCurrentBudgetToCloud([], limitsRef.current);
      resetForm();
    }
  }

  function handleResetFilters() {
    setFilterMember("all");
    setFilterType("all");
    setFilterMonth("all");
    setSearchQuery("");
  }

  async function handleCloseMonth() {
    const keyToClose = monthToClose || closableMonths[0];
    if (!keyToClose) {
      alert("Выберите месяц для закрытия.");
      return;
    }

    const monthItems = transactions.filter((item) => monthKey(item.date) === keyToClose);
    if (!monthItems.length) {
      alert("В этом месяце нет операций.");
      return;
    }

    const preview = buildMonthSummary(keyToClose, monthItems);
    const confirmed = window.confirm(
      `Закрыть ${preview.title}?\n\n` +
        `Доходы: ${currency.format(preview.income)}\n` +
        `Расходы: ${currency.format(preview.expense)}\n` +
        `Баланс: ${currency.format(preview.balance)}\n` +
        `Операций: ${preview.transactionCount}\n\n` +
        `Месяц сохранится в архиве «Итоги», а операции уберутся из текущего расчёта — можно начинать новый месяц с чистого листа.`
    );
    if (!confirmed) return;

    const nextSummaries = [preview, ...monthSummaries.filter((summary) => summary.monthKey !== keyToClose)].sort(
      (a, b) => b.monthKey.localeCompare(a.monthKey)
    );
    const nextTransactions = transactions.filter((item) => monthKey(item.date) !== keyToClose);

    setMonthSummaries(nextSummaries);
    monthSummariesRef.current = nextSummaries;
    setTransactions(nextTransactions);
    transactionsRef.current = nextTransactions;
    setMonthToClose("");
    setExpandedArchiveKey(preview.monthKey);
    setFilterMonth(monthKey(today()));
    setActiveTab("summaries");
    clearChartDrilldown();
    resetForm();

    const saved = await saveCurrentBudgetToCloud(nextTransactions, limitsRef.current, nextSummaries);
    if (!saved) {
      alert("Месяц закрыт на экране, но не сохранился. Не обновляйте страницу.");
    }
  }

  function exportCsv() {
    const header = ["Дата", "Тип", "Участник", "Статья", "Сумма", "Комментарий"];
    const rows = transactions.map((item) => [
      item.date,
      item.type === "income" ? "Доход" : "Расход",
      getMemberName(item.memberId),
      getCategoryLabel(item),
      item.amount,
      item.note || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-budget.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    const blob = new Blob(
      [JSON.stringify({ transactions, limits, monthSummaries }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-budget-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.transactions)) throw new Error("bad file");
        const nextLimits = mergeLimits(parsed.limits);
        const nextSummaries = Array.isArray(parsed.monthSummaries) ? parsed.monthSummaries : [];
        setTransactions(parsed.transactions);
        setLimits(nextLimits);
        setMonthSummaries(nextSummaries);
        transactionsRef.current = parsed.transactions;
        limitsRef.current = nextLimits;
        monthSummariesRef.current = nextSummaries;
        await saveCurrentBudgetToCloud(parsed.transactions, nextLimits, nextSummaries);
        resetForm();
      } catch {
        alert("Не получилось импортировать файл. Проверьте, что это JSON-экспорт из этого приложения.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 safe-area-x safe-area-bottom dark:bg-slate-950 dark:text-slate-100">
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed right-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/95 dark:text-amber-300 dark:hover:bg-slate-800 sm:right-4 sm:top-4"
        aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
        title={isDark ? "Светлая тема" : "Тёмная тема"}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-8">
        <header className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 shadow-2xl sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-200/80 dark:bg-white/10 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 sm:mb-3 sm:px-3 sm:text-sm">
                <Users size={14} className="shrink-0 sm:h-4 sm:w-4" />
                <span className="sm:hidden">Семейный бюджет</span>
                <span className="hidden sm:inline">Семейный бюджет — Сима, Рыжик, Умка, Плюша и Снежок</span>
              </div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-5xl">
                Калькулятор доходов и расходов
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:mt-3 sm:text-base">
                Вносите доходы и траты, следите за лимитами, графиками и балансом.
              </p>
            </div>

            <div
              className={`w-full shrink-0 rounded-2xl p-4 sm:w-auto sm:rounded-3xl sm:p-5 sm:text-right ${
                balance >= 0 ? "bg-green-500/15" : "bg-red-500/15"
              }`}
            >
              <p className="text-sm text-slate-600 dark:text-slate-300">{periodLabel ? `Баланс за ${periodLabel}` : "Текущий баланс"}</p>
              <p className={`text-3xl font-black leading-none sm:text-4xl ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                {currency.format(balance)}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Норма накопления: {savingRate}%</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} />
              <h2 className="text-xl font-bold sm:text-2xl">Участники семьи</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Нажмите на участника, чтобы добавить доход или расход</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {FAMILY_MEMBERS.map((member) => {
              const income = sumAmounts(periodTransactions, (item) => item.memberId === member.id && item.type === "income");
              const expense = sumAmounts(periodTransactions, (item) => item.memberId === member.id && item.type === "expense");

              const isSelected = form.memberId === member.id && !editingId;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleMemberClick(member.id)}
                  title={`Добавить операцию для ${member.name}`}
                  className={`rounded-2xl border bg-white dark:bg-slate-900/70 p-3 text-left transition active:scale-[0.98] sm:p-4 sm:hover:-translate-y-1 sm:hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-900 ${
                    isSelected
                      ? "border-blue-400/60 ring-2 ring-blue-400/30"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                    <MemberAvatar name={member.name} photo={member.photo} size={isCompact ? "md" : "lg"} />
                    <div className="min-w-0">
                      <div className="text-base font-bold sm:text-xl">{member.name}</div>
                      <div className="mt-0.5 text-xs text-green-400 sm:mt-1 sm:text-sm">+ {currency.format(income)}</div>
                      <div className="text-xs text-red-400 sm:text-sm">- {currency.format(expense)}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<TrendingUp />}
            label={periodLabel ? `Доходы (${periodLabel})` : "Доходы"}
            value={currency.format(totalIncome)}
            tone="green"
            onClick={() => openStatSection("history", { filterType: "income" })}
          />
          <StatCard
            icon={<TrendingDown />}
            label={periodLabel ? `Расходы (${periodLabel})` : "Расходы"}
            value={currency.format(totalExpense)}
            tone="red"
            onClick={() => openStatSection("history", { filterType: "expense" })}
          />
          <StatCard
            icon={<Wallet />}
            label={periodLabel ? `Остаток (${periodLabel})` : "Остаток"}
            value={currency.format(balance)}
            tone={balance >= 0 ? "green" : "red"}
            onClick={() => openStatSection("dashboard")}
          />
          <StatCard
            icon={<PiggyBank />}
            label={periodLabel ? `Средний расход (${periodLabel})` : "Средний расход"}
            value={currency.format(averageExpense)}
            tone="slate"
            onClick={() => openStatSection("history", { filterType: "expense" })}
          />
          <StatCard
            icon={<Target />}
            label={periodLabel ? `Главная статья (${periodLabel})` : "Главная статья"}
            value={biggestExpense ? `${biggestExpense.name}: ${currency.format(biggestExpense.value)}` : "Пока нет"}
            tone="slate"
            onClick={() => openStatSection("dashboard")}
          />
        </section>

        <main ref={mainPanelRef} className="grid gap-4 scroll-mt-4 sm:gap-6 lg:grid-cols-[minmax(0,430px)_1fr]">
          <section ref={formPanelRef} className="scroll-mt-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">
                {editingId
                  ? "Редактировать операцию"
                  : form.memberId !== "all"
                    ? `Добавить операцию — ${selectedMemberPreview.name}`
                    : "Добавить операцию"}
              </h2>
              {editingId && (
                <button type="button" onClick={() => resetForm()} className="inline-flex items-center gap-2 rounded-xl bg-slate-200/80 dark:bg-white/10 px-3 py-2 text-sm hover:bg-slate-300 dark:hover:bg-white/15">
                  <X size={16} /> Отмена
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-900 p-1">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className={`rounded-xl px-4 py-3 font-semibold transition ${form.type === "expense" ? "bg-red-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"}`}
                >
                  Расход
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className={`rounded-xl px-4 py-3 font-semibold transition ${form.type === "income" ? "bg-green-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"}`}
                >
                  Доход
                </button>
              </div>

              <Field label="Участник">
                <select className="input" value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
                  {MEMBER_OPTIONS.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </Field>

              <div className="mb-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-3">
                <div className="flex items-center gap-3">
            <MemberAvatar name={selectedMemberPreview.name} photo={selectedMemberPreview.photo} size="md" />
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Выбрано</div>
                    <div className="font-semibold">{selectedMemberPreview.name}</div>
                  </div>
                </div>
              </div>

              <Field label="Категория">
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(form.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </Field>

              {form.category === "Своя статья" && (
                <Field label="Своя статья">
                  <input className="input" value={form.customCategory} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} placeholder="Например: ремонт, кружки, отпуск" />
                </Field>
              )}

              <Field label="Сумма">
                <input ref={amountInputRef} className="input" type="number" min="0" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </Field>

              <Field label="Дата">
                <div className="flex gap-2">
                  <input
                    className="input min-w-0 flex-1"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="ДД.ММ.ГГГГ"
                    value={dateInput}
                    onChange={(e) => {
                      setDateInput(e.target.value);
                      const iso = parseDisplayDate(e.target.value);
                      if (iso) setForm((prev) => ({ ...prev, date: iso }));
                    }}
                    onBlur={() => {
                      const iso = parseDisplayDate(dateInput) || form.date;
                      setForm((prev) => ({ ...prev, date: iso }));
                      setDateInput(formatDisplayDate(iso));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => openNativeDatePicker(datePickerRef)}
                    className="flex min-h-[52px] w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Открыть календарь"
                    aria-label="Открыть календарь"
                  >
                    <CalendarDays size={20} />
                  </button>
                  <input
                    ref={datePickerRef}
                    type="date"
                    value={form.date}
                    onChange={(e) => syncDateFromIso(e.target.value, setForm, setDateInput)}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                  />
                </div>
              </Field>

              <Field label="Комментарий">
                <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Например: магазин, кружок, поездка" />
              </Field>

              <button
                type="submit"
                className={`mt-4 flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white shadow-lg transition active:scale-[0.99] sm:hover:scale-[1.01] ${form.type === "expense" ? "bg-red-500 hover:bg-red-400" : "bg-green-500 hover:bg-green-400"}`}
              >
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {editingId ? "Сохранить изменения" : "Добавить"}
              </button>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={exportCsv} className="utility-button"><Download size={16} /> CSV</button>
                <button type="button" onClick={exportJson} className="utility-button"><Download size={16} /> JSON</button>
                <label className="utility-button cursor-pointer">
                  <Upload size={16} /> Импорт
                  <input type="file" accept="application/json" onChange={importJson} className="hidden" />
                </label>
                <button type="button" onClick={handleResetFilters} className="utility-button"><Filter size={16} /> Фильтры</button>
                <button type="button" onClick={handleClearAll} className="utility-button"><Trash2 size={16} /> Очистить</button>
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-2 shadow-xl">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LineChart size={16} />} label="Графики" compact={isCompact} />
                <TabButton active={activeTab === "limits"} onClick={() => setActiveTab("limits")} icon={<Target size={16} />} label="Лимиты" compact={isCompact} />
                <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<CalendarDays size={16} />} label="История" compact={isCompact} />
                <TabButton active={activeTab === "summaries"} onClick={() => setActiveTab("summaries")} icon={<Archive size={16} />} label="Итоги" compact={isCompact} />
                <TabButton active={activeTab === "advice"} onClick={() => setActiveTab("advice")} icon={<CheckCircle2 size={16} />} label="Советы" compact={isCompact} />
              </div>
            </div>

            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <ChartCard title={periodLabel ? `На что уходит больше денег (${periodLabel})` : "На что уходит больше денег"}>
                    {expensesByCategory.length ? (
                      <div className="px-2 py-4 sm:px-6 sm:py-6">
                        <ResponsiveContainer width="100%" height={pieOnlyHeight}>
                          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <Pie
                              data={expensesByCategory}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={isCompact ? "78%" : "82%"}
                              label={({ percent }) => `${Math.round(percent * 100)}%`}
                              labelLine={{ stroke: chartAxisColor, strokeWidth: 1 }}
                              onClick={(_, index) => {
                                const name = expensesByCategory[index]?.name;
                                if (name) openCategoryDrilldown(name);
                              }}
                              cursor="pointer"
                            >
                              {expensesByCategory.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                  opacity={
                                    selectedExpenseCategory && selectedExpenseCategory !== entry.name ? 0.35 : 1
                                  }
                                  stroke={selectedExpenseCategory === entry.name ? "#38bdf8" : undefined}
                                  strokeWidth={selectedExpenseCategory === entry.name ? 2 : 0}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [currency.format(value), name]}
                              {...chartTooltipProps}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <CategoryExpenseLegend
                          payload={categoryLegendPayload}
                          selectedCategory={selectedExpenseCategory}
                          onSelect={openCategoryDrilldown}
                        />
                      </div>
                    ) : (
                      <EmptyState text="Добавьте расходы, чтобы увидеть диаграмму." />
                    )}
                  </ChartCard>

                  <ChartCard title="Доходы и расходы по участникам">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={memberBarData} margin={isCompact ? { left: -12, right: 4, bottom: 0 } : undefined}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                        <XAxis dataKey="name" stroke={chartAxisColor} tick={{ fontSize: isCompact ? 11 : 12 }} />
                        <YAxis stroke={chartAxisColor} width={isCompact ? 36 : 60} tick={{ fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}к`} />
                        <Tooltip formatter={formatChartTooltipValue} {...chartTooltipProps} />
                        <Legend />
                        <Bar
                          dataKey="Доходы"
                          fill="#22c55e"
                          radius={[8, 8, 0, 0]}
                          cursor="pointer"
                          onClick={(data) => openMemberDrilldown(data.name, "income")}
                        />
                        <Bar
                          dataKey="Расходы"
                          fill="#ef4444"
                          radius={[8, 8, 0, 0]}
                          cursor="pointer"
                          onClick={(data) => openMemberDrilldown(data.name, "expense")}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                <ChartCard title={periodLabel ? `Расходы по статьям (${periodLabel})` : "Расходы по статьям"}>
                  {expensesByCategory.length ? (
                    <ResponsiveContainer width="100%" height={categoryBarHeight}>
                      <BarChart
                        data={expensesByCategory}
                        margin={isCompact ? { left: -8, right: 8, bottom: 56 } : { left: 0, right: 8, bottom: 48 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                        <XAxis
                          dataKey="name"
                          stroke={chartAxisColor}
                          interval={0}
                          height={isCompact ? 72 : 60}
                          tick={(props) => (
                            <CategoryAxisTick
                              {...props}
                              isDark={isDark}
                              selectedCategory={selectedExpenseCategory}
                              onSelect={openCategoryDrilldown}
                            />
                          )}
                        />
                        <YAxis
                          stroke={chartAxisColor}
                          width={isCompact ? 36 : 60}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => `${Math.round(value / 1000)}к`}
                        />
                        <Tooltip formatter={formatChartTooltipValue} {...chartTooltipProps} />
                        <Bar
                          dataKey="value"
                          radius={[8, 8, 0, 0]}
                          cursor="pointer"
                          onClick={(data) => openCategoryDrilldown(data.name)}
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              opacity={
                                selectedExpenseCategory && selectedExpenseCategory !== entry.name ? 0.35 : 1
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState text="Добавьте расходы, чтобы увидеть диаграмму." />
                  )}
                </ChartCard>

                <ChartCard title="Динамика по месяцам">
                  {monthlyData.length ? (
                    <ResponsiveContainer width="100%" height={chartHeight + 10}>
                      <AreaChart data={monthlyData} margin={isCompact ? { left: -12, right: 4 } : undefined}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                        <XAxis dataKey="month" stroke={chartAxisColor} tick={{ fontSize: 11 }} />
                        <YAxis stroke={chartAxisColor} width={isCompact ? 36 : 60} tick={{ fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}к`} />
                        <Tooltip formatter={(value) => currency.format(value)} {...chartTooltipProps} />
                        <Legend />
                        <Area type="monotone" dataKey="Доходы" stroke="#22c55e" fill="#22c55e" fillOpacity={0.18} />
                        <Area type="monotone" dataKey="Расходы" stroke="#ef4444" fill="#ef4444" fillOpacity={0.18} />
                        <Area type="monotone" dataKey="Баланс" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.12} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <EmptyState text="Добавьте операции за разные месяцы, чтобы увидеть динамику." />}
                </ChartCard>

                {(selectedExpenseCategory || memberDrilldown) && (
                  <div ref={chartDrilldownRef} className="scroll-mt-4">
                    <ChartDrilldownTable
                      title={
                        selectedExpenseCategory
                          ? `Операции по статье «${selectedExpenseCategory}»`
                          : `Операции: ${memberDrilldown.memberName} — ${
                              memberDrilldown.transactionType === "income" ? "доходы" : "расходы"
                            }`
                      }
                      transactions={
                        selectedExpenseCategory ? categoryDetailTransactions : memberDrilldownTransactions
                      }
                      total={selectedExpenseCategory ? selectedCategoryAmount : memberDrilldownTotal}
                      onClose={clearChartDrilldown}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "limits" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Target size={20} />
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {periodLabel ? `Лимиты за ${periodLabel}` : "Лимиты на текущий месяц"}
                  </h2>
                </div>

                <div className="space-y-3">
                  {limitsData.map((item) => (
                    <div key={item.category} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4">
                      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2 font-bold">
                            {item.percent >= 100 && <AlertTriangle size={18} className="text-red-400" />}
                            {item.category}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Потрачено {currency.format(item.spent)} из {currency.format(item.limit)}. Осталось {currency.format(item.remaining)}.
                          </div>
                        </div>
                        <input
                          className="small-input w-full md:w-40"
                          type="number"
                          min="0"
                          value={item.limit}
                          onChange={(e) => {
                            const nextLimits = {
                              ...limits,
                              [item.category]: Number(e.target.value || 0),
                            };
                            setLimits(nextLimits);
                            limitsRef.current = nextLimits;
                          }}
                          onBlur={() => {
                            saveCurrentBudgetToCloud(transactionsRef.current, limitsRef.current);
                          }}
                        />
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                        <div className={`h-full rounded-full ${item.percent >= 100 ? "bg-red-500" : item.percent >= 80 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(item.percent, 100)}%` }} />
                      </div>
                      <div className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">{item.percent}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-xl font-bold sm:text-2xl">История операций</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">В фильтре: доходы {currency.format(filteredIncome)}, расходы {currency.format(filteredExpense)}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                    <div className="relative sm:col-span-2 md:col-span-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input className="small-input w-full pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск" />
                    </div>
                    <select className="small-input" value={filterMember} onChange={(e) => setFilterMember(e.target.value)}>
                      {MEMBER_OPTIONS.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                    <select className="small-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                      <option value="all">Все типы</option>
                      <option value="income">Доходы</option>
                      <option value="expense">Расходы</option>
                    </select>
                    <select className="small-input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                      <option value="all">Все месяцы</option>
                      {availableMonths.map((key) => <option key={key} value={key}>{monthLabel(key)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 md:hidden">
                  {historyDayGroups.map((group) => (
                    <div key={group.date} className="space-y-3">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{formatDisplayDate(group.date)}</p>
                      {group.items.map((item) => (
                        <article
                          key={item.id}
                          className="space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4"
                        >
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              item.type === "income" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {item.type === "income" ? "Доход" : "Расход"}
                          </span>
                          <div className="flex items-center gap-3">
                            <MemberAvatar
                              name={getMemberName(item.memberId)}
                              photo={getMemberPhoto(item.memberId)}
                              size="sm"
                            />
                            <span className="font-medium">{getMemberName(item.memberId)}</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-200">{getCategoryLabel(item)}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{item.note || "—"}</p>
                          <p
                            className={`text-lg font-bold ${
                              item.type === "income" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {item.type === "income" ? "+" : "-"}
                            {currency.format(item.amount)}
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-300 dark:active:bg-white/15"
                              title="Редактировать"
                            >
                              <Pencil size={16} /> Изменить
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-red-500/10 text-sm text-red-400 active:bg-red-500/20"
                              title="Удалить"
                            >
                              <Trash2 size={16} /> Удалить
                            </button>
                          </div>
                        </article>
                      ))}
                      <div className="rounded-xl border border-slate-300 dark:border-white/15 bg-slate-200 dark:bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <span className="text-slate-500 dark:text-slate-400">Всего за день: </span>
                        {formatDayTotal(group)}
                      </div>
                    </div>
                  ))}
                  {!visibleTransactions.length && <EmptyState text="Операций по выбранным фильтрам пока нет." />}
                </div>

                <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 md:block">
                  <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3">Дата</th>
                        <th className="p-3">Тип</th>
                        <th className="p-3">Участник</th>
                        <th className="p-3">Статья</th>
                        <th className="p-3">Комментарий</th>
                        <th className="p-3 text-right">Сумма</th>
                        <th className="p-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyDayGroups.map((group) => (
                        <Fragment key={group.date}>
                          {group.items.map((item) => (
                            <tr key={item.id} className="border-t border-slate-200 dark:border-white/10 hover:bg-slate-100/90 dark:bg-white/5">
                              <td className="p-3 text-slate-600 dark:text-slate-300">{formatDisplayDate(item.date)}</td>
                              <td className="p-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    item.type === "income" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                                  }`}
                                >
                                  {item.type === "income" ? "Доход" : "Расход"}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <MemberAvatar
                                    name={getMemberName(item.memberId)}
                                    photo={getMemberPhoto(item.memberId)}
                                    size="sm"
                                  />
                                  <span>{getMemberName(item.memberId)}</span>
                                </div>
                              </td>
                              <td className="p-3">{getCategoryLabel(item)}</td>
                              <td className="p-3 text-slate-500 dark:text-slate-400">{item.note || "—"}</td>
                              <td
                                className={`p-3 text-right font-bold ${
                                  item.type === "income" ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {item.type === "income" ? "+" : "-"}
                                {currency.format(item.amount)}
                              </td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(item)}
                                    className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:text-white"
                                    title="Редактировать"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-red-500/15 hover:text-red-400"
                                    title="Удалить"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-slate-900/80">
                            <td colSpan={7} className="p-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                              <span className="text-slate-500 dark:text-slate-400">Всего за день: </span>
                              {formatDayTotal(group)}
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                  {!visibleTransactions.length && <EmptyState text="Операций по выбранным фильтрам пока нет." />}
                </div>
              </div>
            )}

            {activeTab === "advice" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  <h2 className="text-xl font-bold sm:text-2xl">Подсказки по бюджету</h2>
                </div>

                <div className="space-y-3">
                  {advice.map((tip, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4 text-slate-700 dark:text-slate-200">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "summaries" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Archive size={20} />
                    <h2 className="text-xl font-bold sm:text-2xl">Закрыть месяц и начать заново</h2>
                  </div>
                  <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                    Подведите итог месяца: доходы, расходы и баланс сохранятся в архиве. Операции этого месяца уберутся из
                    текущего расчёта — можно вести новый месяц с чистого листа. Архив всегда можно посмотреть ниже.
                  </p>

                  {closableMonths.length ? (
                    <div className="space-y-4">
                      <Field label="Месяц для закрытия">
                        <select
                          className="input"
                          value={effectiveMonthToClose}
                          onChange={(e) => setMonthToClose(e.target.value)}
                        >
                          {closableMonths.map((key) => (
                            <option key={key} value={key}>
                              {formatMonthGroupTitle(key)}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {monthClosePreview && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Доходы</p>
                            <p className="text-lg font-bold text-green-400">{currency.format(monthClosePreview.income)}</p>
                          </div>
                          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Расходы</p>
                            <p className="text-lg font-bold text-red-400">{currency.format(monthClosePreview.expense)}</p>
                          </div>
                          <div className={`rounded-2xl border p-3 ${monthClosePreview.balance >= 0 ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"}`}>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Баланс</p>
                            <p className={`text-lg font-bold ${monthClosePreview.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {currency.format(monthClosePreview.balance)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Операций</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{monthClosePreview.transactionCount}</p>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleCloseMonth}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-bold text-slate-900 dark:text-white transition hover:bg-sky-400"
                      >
                        <Archive size={18} />
                        Закрыть месяц и заархивировать
                      </button>
                    </div>
                  ) : (
                    <EmptyState text="Все месяцы с операциями уже закрыты, или пока нет данных для закрытия." />
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarDays size={20} />
                    <h2 className="text-xl font-bold sm:text-2xl">Архив закрытых месяцев</h2>
                  </div>

                  {monthSummaries.length ? (
                    <div className="space-y-4">
                      {monthSummaries.map((summary) => (
                        <MonthArchiveCard
                          key={summary.monthKey}
                          summary={summary}
                          expanded={expandedArchiveKey === summary.monthKey}
                          onToggle={() =>
                            setExpandedArchiveKey((prev) => (prev === summary.monthKey ? null : summary.monthKey))
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="Закрытых месяцев пока нет. Когда месяц закончится, закройте его здесь." />
                  )}
                </div>
              </div>
            )}
          </section>
        </main>

        <footer className="mt-2 border-t border-slate-200 dark:border-white/10 pb-2 pt-3 text-center text-xs text-slate-500 dark:text-slate-400 sm:pb-0 sm:text-sm">
          Создано Викторией Михалевой ·{" "}
          <a
            href="https://www.content-system.ru/"
            target="_blank"
            rel="noreferrer"
            className="text-slate-600 dark:text-slate-300 underline decoration-slate-400/40 underline-offset-2 transition hover:text-slate-900 dark:decoration-white/30 dark:hover:text-white"
          >
            контент, ИИ и цифровые проекты
          </a>
        </footer>
      </div>
    </div>
  );
}


function Field({ label, children }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function TabButton({ active, onClick, icon, label, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex touch-manipulation items-center justify-center rounded-2xl font-semibold transition ${
        compact ? "gap-1.5 px-2 py-2.5 text-sm" : "gap-2 px-4 py-3"
      } ${active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, tone, onClick }) {
  const toneClass = {
    green: "border-green-500/20 bg-green-500/10 text-green-400",
    red: "border-red-500/20 bg-red-500/10 text-red-400",
    slate: "border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 text-slate-700 dark:text-slate-200",
  }[tone];

  const className = `w-full rounded-2xl border p-4 text-left shadow-xl transition sm:rounded-3xl sm:p-5 ${toneClass} ${
    onClick ? "cursor-pointer touch-manipulation hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99]" : ""
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-white/10 sm:mb-3 sm:h-11 sm:w-11">{icon}</div>
        <p className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">{label}</p>
        <p className="mt-1 break-words text-base font-black leading-snug text-slate-900 dark:text-white sm:text-xl">{value}</p>
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-white/10 sm:mb-3 sm:h-11 sm:w-11">{icon}</div>
      <p className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">{label}</p>
      <p className="mt-1 break-words text-base font-black leading-snug text-slate-900 dark:text-white sm:text-xl">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-white/5 p-4 shadow-xl sm:rounded-3xl sm:p-5">
      <h2 className="mb-3 text-lg font-bold sm:mb-4 sm:text-xl">{title}</h2>
      {children}
    </div>
  );
}

function MonthArchiveCard({ summary, expanded, onToggle }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{summary.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Закрыт {formatDisplayDate(summary.closedAt)} · {summary.transactionCount} операций · накопление {summary.savingRate}%
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl bg-slate-200/80 dark:bg-white/10 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/15"
        >
          {expanded ? "Скрыть" : "Подробнее"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Доходы</p>
          <p className="font-bold text-green-400">{currency.format(summary.income)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Расходы</p>
          <p className="font-bold text-red-400">{currency.format(summary.expense)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Баланс</p>
          <p className={`font-bold ${summary.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
            {currency.format(summary.balance)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Главная статья</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{summary.biggestExpense}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-200 dark:border-white/10 pt-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">По участникам</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {summary.byMember.map((member) => (
                <div key={member.memberId} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">{member.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {" · "}+{currency.format(member.income)} / -{currency.format(member.expense)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {summary.byCategory?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">По статьям расходов</p>
              <div className="space-y-2">
                {summary.byCategory.slice(0, 8).map((row) => (
                  <div key={row.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{row.name}</span>
                    <span className="font-semibold text-red-400">{currency.format(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="p-2">Дата</th>
                  <th className="p-2">Участник</th>
                  <th className="p-2">Статья</th>
                  <th className="p-2 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {summary.transactions
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 dark:border-white/10">
                      <td className="p-2 text-slate-600 dark:text-slate-300">{formatDisplayDate(item.date)}</td>
                      <td className="p-2">{getMemberName(item.memberId)}</td>
                      <td className="p-2">{getCategoryLabel(item)}</td>
                      <td className={`p-2 text-right font-semibold ${item.type === "income" ? "text-green-400" : "text-red-400"}`}>
                        {item.type === "income" ? "+" : "-"}
                        {currency.format(item.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartDrilldownTable({ title, transactions, total, onClose, onEdit, onDelete }) {
  const monthGroups = useMemo(() => groupTransactionsByMonth(transactions), [transactions]);

  return (
    <div className="rounded-2xl border border-sky-300 bg-sky-50 p-4 shadow-xl dark:border-sky-400/30 dark:bg-sky-500/5 sm:rounded-3xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold sm:text-xl">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {transactions.length} {transactions.length === 1 ? "операция" : transactions.length < 5 ? "операции" : "операций"}
            {" · "}итого {currency.format(total)}
            {monthGroups.length > 1 ? ` · ${monthGroups.length} месяца` : ""}
          </p>
          {monthGroups.length > 0 && (
            <p className="mt-1 text-xs text-sky-600 dark:text-sky-300/80">Сгруппировано по месяцам, сначала новые</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/15 hover:text-slate-900 dark:text-white"
        >
          <X size={16} /> Закрыть
        </button>
      </div>

      {!transactions.length ? (
        <EmptyState text="Операций по выбранному фильтру нет." />
      ) : (
        <>
          <div className="space-y-5 md:hidden">
            {monthGroups.map((group) => (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-sky-300 bg-sky-100 px-4 py-3 dark:border-sky-400/30 dark:bg-sky-500/15">
                  <span className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-100">
                    <CalendarDays size={16} />
                    {group.title}
                  </span>
                  <span className="text-right text-sm text-sky-700 dark:text-sky-200">
                    {group.items.length} оп. · <span className="font-bold text-slate-900 dark:text-white">{currency.format(group.total)}</span>
                  </span>
                </div>
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{formatDisplayDate(item.date)}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.type === "income" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {item.type === "income" ? "Доход" : "Расход"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MemberAvatar name={getMemberName(item.memberId)} photo={getMemberPhoto(item.memberId)} size="sm" />
                      <span className="font-medium">{getMemberName(item.memberId)}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{getCategoryLabel(item)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.note || "—"}</p>
                    <p className={`text-lg font-bold ${item.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {item.type === "income" ? "+" : "-"}
                      {currency.format(item.amount)}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-sm text-slate-700 dark:text-slate-200"
                      >
                        <Pencil size={16} /> Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-red-500/10 text-sm text-red-400"
                      >
                        <Trash2 size={16} /> Удалить
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 md:block">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Участник</th>
                  <th className="p-3">Статья</th>
                  <th className="p-3">Комментарий</th>
                  <th className="p-3 text-right">Сумма</th>
                  <th className="p-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {monthGroups.map((group) => (
                  <Fragment key={group.key}>
                    <tr className="border-t-2 border-sky-300 bg-sky-100 dark:border-sky-400/40 dark:bg-sky-500/15">
                      <td colSpan={6} className="p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-base font-bold text-sky-800 dark:text-sky-100">
                            <CalendarDays size={16} />
                            {group.title}
                          </span>
                          <span className="text-sm text-sky-700 dark:text-sky-200">
                            {group.items.length} {group.items.length === 1 ? "операция" : group.items.length < 5 ? "операции" : "операций"}
                            {" · "}
                            <span className="font-bold text-slate-900 dark:text-white">{currency.format(group.total)}</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200 dark:border-white/10 hover:bg-slate-100/90 dark:bg-white/5">
                        <td className="p-3 text-slate-600 dark:text-slate-300">{formatDisplayDate(item.date)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={getMemberName(item.memberId)} photo={getMemberPhoto(item.memberId)} size="sm" />
                            <span>{getMemberName(item.memberId)}</span>
                          </div>
                        </td>
                        <td className="p-3">{getCategoryLabel(item)}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{item.note || "—"}</td>
                        <td className={`p-3 text-right font-bold ${item.type === "income" ? "text-green-400" : "text-red-400"}`}>
                          {item.type === "income" ? "+" : "-"}
                          {currency.format(item.amount)}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:text-white"
                              title="Редактировать"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-red-500/15 hover:text-red-400"
                              title="Удалить"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryExpenseLegend({ payload, selectedCategory, onSelect }) {
  if (!payload?.length) return null;

  return (
    <ul className="mt-4 grid list-none grid-cols-1 gap-2 border-t border-slate-200 dark:border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-3">
      {payload.map((entry) => {
        const name = entry.value;
        const isSelected = selectedCategory === name;
        const amount = entry.payload?.value || 0;

        return (
          <li key={name}>
            <button
              type="button"
              onClick={() => onSelect(name)}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition sm:text-sm ${
                isSelected ? "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: entry.color }} />
              <span className="min-w-0 flex-1 truncate">{name}</span>
              {isSelected && <span className="shrink-0 font-semibold text-slate-900 dark:text-white">{currency.format(amount)}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryAxisTick({ x, y, payload, selectedCategory, onSelect, isDark }) {
  const name = payload?.value;
  const isSelected = selectedCategory === name;
  const fill = isSelected ? "#0284c7" : isDark ? "#cbd5e1" : "#475569";

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="end"
        fill={fill}
        fontSize={10}
        fontWeight={isSelected ? 700 : 400}
        transform="rotate(-28)"
        style={{ cursor: "pointer" }}
        onClick={() => onSelect(name)}
      >
        {name}
      </text>
    </g>
  );
}

function EmptyState({ text }) {
  return <div className="flex min-h-[160px] items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400">{text}</div>;
}

function MemberAvatar({ name, photo, size = "md" }) {
  const initial = String(name || "?").trim().slice(0, 1).toUpperCase();

  const box =
    size === "lg"
      ? "h-20 w-20 text-2xl"
      : size === "sm"
        ? "h-8 w-8 text-xs"
        : "h-12 w-12 text-base";

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white/10 ${box}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-600/45 to-violet-700/45 font-bold text-slate-900 dark:text-white ring-2 ring-white/10 ${box}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
