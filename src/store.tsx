import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { seedData } from './lib/seed';
import type { AppData, Contribution, Expense, EventInfo } from './types';

const STORAGE_KEY = 'biye-hisab:v1';

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (
        parsed &&
        parsed.version === 1 &&
        Array.isArray(parsed.contributions) &&
        Array.isArray(parsed.expenses) &&
        parsed.event
      ) {
        return parsed;
      }
    }
  } catch {
    // নষ্ট ডেটা হলে নমুনা হিসাব দিয়ে শুরু
  }
  return seedData();
}

interface StoreValue {
  data: AppData;
  toast: string | null;
  notify: (message: string) => void;
  saveEvent: (event: EventInfo) => void;
  saveContribution: (item: Contribution) => void;
  removeContribution: (id: string) => void;
  saveExpense: (item: Expense) => void;
  removeExpense: (id: string) => void;
  resetToDemo: () => void;
  clearAll: () => void;
  importData: (next: AppData) => void;
  mergeData: (next: AppData) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // স্টোরেজ ভরে গেলে চুপচাপ এগিয়ে যাই
    }
  }, [data]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveEvent = useCallback((event: EventInfo) => {
    setData((current) => ({ ...current, event }));
  }, []);

  const saveContribution = useCallback((item: Contribution) => {
    setData((current) => {
      const exists = current.contributions.some((row) => row.id === item.id);
      return {
        ...current,
        contributions: exists
          ? current.contributions.map((row) => (row.id === item.id ? item : row))
          : [item, ...current.contributions],
      };
    });
  }, []);

  const removeContribution = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      contributions: current.contributions.filter((row) => row.id !== id),
    }));
  }, []);

  const saveExpense = useCallback((item: Expense) => {
    setData((current) => {
      const exists = current.expenses.some((row) => row.id === item.id);
      return {
        ...current,
        expenses: exists
          ? current.expenses.map((row) => (row.id === item.id ? item : row))
          : [item, ...current.expenses],
      };
    });
  }, []);

  const removeExpense = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((row) => row.id !== id),
    }));
  }, []);

  const resetToDemo = useCallback(() => setData(seedData()), []);

  const clearAll = useCallback(() => {
    setData((current) => ({ ...current, contributions: [], expenses: [] }));
  }, []);

  const importData = useCallback((next: AppData) => {
    setData({
      version: 1,
      event: next.event ?? seedData().event,
      contributions: Array.isArray(next.contributions) ? next.contributions : [],
      expenses: Array.isArray(next.expenses) ? next.expenses : [],
    });
  }, []);

  /** অন্য ডিভাইসের হিসাব বর্তমান খাতার সাথে জোড়া লাগায় — একই id থাকলে পুরোনোটি থাকে */
  const mergeData = useCallback((next: AppData) => {
    setData((current) => {
      const contributionIds = new Set(current.contributions.map((row) => row.id));
      const expenseIds = new Set(current.expenses.map((row) => row.id));
      const contributions = [
        ...current.contributions,
        ...(Array.isArray(next.contributions) ? next.contributions : []).filter(
          (row) => row && !contributionIds.has(row.id),
        ),
      ];
      const expenses = [
        ...current.expenses,
        ...(Array.isArray(next.expenses) ? next.expenses : []).filter(
          (row) => row && !expenseIds.has(row.id),
        ),
      ];
      return {
        version: 1,
        // জোড়া লাগানোর সময় এই ডিভাইসের বিয়ের তথ্যই অক্ষুণ্ণ থাকে
        event: current.event,
        contributions,
        expenses,
      };
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      toast,
      notify,
      saveEvent,
      saveContribution,
      removeContribution,
      saveExpense,
      removeExpense,
      resetToDemo,
      clearAll,
      importData,
      mergeData,
    }),
    [
      data,
      toast,
      notify,
      saveEvent,
      saveContribution,
      removeContribution,
      saveExpense,
      removeExpense,
      resetToDemo,
      clearAll,
      importData,
      mergeData,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
