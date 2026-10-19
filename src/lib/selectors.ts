import {
  EXPENSE_CATEGORIES,
  METHODS,
  RELATIONS,
  SIDES,
  colorOf,
  labelOf,
  type AppData,
  type Contribution,
  type Expense,
  type ExpenseCategory,
  type Relation,
  type Side,
} from '../types';
import { shortDate } from './format';

export interface Totals {
  pledged: number;
  collected: number;
  due: number;
  expenses: number;
  balance: number;
  contributors: number;
  fullyPaid: number;
  average: number;
  largest: number;
  target: number;
  budget: number;
  budgetLeft: number;
  targetProgress: number;
  pledgeProgress: number;
  budgetProgress: number;
}

export function totals(data: AppData): Totals {
  const collected = data.contributions.reduce((sum, item) => sum + item.amount, 0);
  const pledged = data.contributions.reduce(
    (sum, item) => sum + Math.max(item.pledged, item.amount),
    0,
  );
  const expenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);
  const target = data.event.target || 0;
  const budget = data.event.budget || 0;
  const clamp = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

  return {
    pledged,
    collected,
    due: Math.max(0, pledged - collected),
    expenses,
    balance: collected - expenses,
    contributors: data.contributions.length,
    fullyPaid: data.contributions.filter((item) => item.amount >= item.pledged).length,
    average: data.contributions.length ? collected / data.contributions.length : 0,
    largest: data.contributions.reduce((max, item) => Math.max(max, item.amount), 0),
    target,
    budget,
    budgetLeft: budget - expenses,
    targetProgress: clamp(target ? (collected / target) * 100 : 0),
    pledgeProgress: clamp(pledged ? (collected / pledged) * 100 : 0),
    budgetProgress: clamp(budget ? (expenses / budget) * 100 : 0),
  };
}

export interface DayPoint {
  date: string;
  label: string;
  daily: number;
  cumulative: number;
}

/** দিনভিত্তিক আদায় — মাঝের ফাঁকা দিনগুলোও শূন্য হিসেবে রাখা হয় */
export function dailySeries(contributions: Contribution[]): DayPoint[] {
  if (!contributions.length) return [];
  const perDay = new Map<string, number>();
  contributions.forEach((item) => {
    perDay.set(item.date, (perDay.get(item.date) ?? 0) + item.amount);
  });

  const sorted = [...perDay.keys()].sort();
  const start = new Date(`${sorted[0]}T00:00:00`);
  const end = new Date(`${sorted[sorted.length - 1]}T00:00:00`);
  const points: DayPoint[] = [];
  let running = 0;

  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 86400000)) {
    const iso = cursor.toISOString().slice(0, 10);
    const daily = perDay.get(iso) ?? 0;
    running += daily;
    points.push({ date: iso, label: shortDate(iso), daily, cumulative: running });
  }
  return points;
}

export interface Slice {
  id: string;
  label: string;
  value: number;
  count: number;
  color: string;
}

function groupContributions(
  contributions: Contribution[],
  key: 'side' | 'relation' | 'method',
): Slice[] {
  const buckets = new Map<string, Slice>();
  contributions.forEach((item) => {
    const id = item[key];
    const catalog =
      key === 'side' ? SIDES : key === 'relation' ? RELATIONS : METHODS;
    const existing = buckets.get(id);
    if (existing) {
      existing.value += item.amount;
      existing.count += 1;
    } else {
      buckets.set(id, {
        id,
        label: labelOf(catalog as never, id as never),
        value: item.amount,
        count: 1,
        color: colorOf(catalog as never, id as never),
      });
    }
  });
  return [...buckets.values()].sort((a, b) => b.value - a.value);
}

export const bySide = (contributions: Contribution[]) =>
  groupContributions(contributions, 'side') as (Slice & { id: Side })[];
export const byRelation = (contributions: Contribution[]) =>
  groupContributions(contributions, 'relation') as (Slice & { id: Relation })[];
export const byMethod = (contributions: Contribution[]) =>
  groupContributions(contributions, 'method') as Slice[];

export function byCategory(expenses: Expense[]): (Slice & { id: ExpenseCategory })[] {
  const buckets = new Map<ExpenseCategory, Slice & { id: ExpenseCategory }>();
  expenses.forEach((item) => {
    const meta = EXPENSE_CATEGORIES.find((entry) => entry.id === item.category);
    const existing = buckets.get(item.category);
    if (existing) {
      existing.value += item.amount;
      existing.count += 1;
    } else {
      buckets.set(item.category, {
        id: item.category,
        label: meta?.label ?? item.category,
        value: item.amount,
        count: 1,
        color: meta?.color ?? '#9c8a8f',
      });
    }
  });
  return [...buckets.values()].sort((a, b) => b.value - a.value);
}

export function topContributors(contributions: Contribution[], limit = 6): Contribution[] {
  return [...contributions].sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export function recentActivity(
  contributions: Contribution[],
  expenses: Expense[],
  limit = 6,
): { id: string; kind: 'in' | 'out'; title: string; amount: number; date: string }[] {
  const rows = [
    ...contributions.map((item) => ({
      id: `c-${item.id}`,
      kind: 'in' as const,
      title: item.name,
      amount: item.amount,
      date: item.date,
    })),
    ...expenses.map((item) => ({
      id: `e-${item.id}`,
      kind: 'out' as const,
      title: item.title,
      amount: item.amount,
      date: item.date,
    })),
  ];
  return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export function dueContributors(contributions: Contribution[]): Contribution[] {
  return contributions
    .filter((item) => item.amount < item.pledged)
    .sort((a, b) => b.pledged - b.amount - (a.pledged - a.amount));
}
