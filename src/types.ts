import type { LucideIcon } from 'lucide-react';
import {
  Camera,
  Car,
  Flower2,
  Gem,
  Landmark,
  Music4,
  Package,
  Shirt,
  UtensilsCrossed,
} from 'lucide-react';

export type TabId = 'dashboard' | 'collections' | 'expenses' | 'reports' | 'settings';

export type Side = 'groom' | 'bride';

export type Relation =
  | 'relative'
  | 'friend'
  | 'neighbour'
  | 'colleague'
  | 'teacher'
  | 'other';

export type Method = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'cheque';

export type ExpenseCategory =
  | 'food'
  | 'venue'
  | 'decor'
  | 'clothing'
  | 'jewelry'
  | 'photo'
  | 'music'
  | 'transport'
  | 'other';

export interface Contribution {
  id: string;
  name: string;
  phone: string;
  side: Side;
  relation: Relation;
  method: Method;
  /** টাকা হাতে এসেছে */
  amount: number;
  /** মোট প্রতিশ্রুতি — amount এর বেশি হলে বাকি আছে */
  pledged: number;
  date: string;
  note: string;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidTo: string;
  note: string;
}

export interface EventInfo {
  title: string;
  bride: string;
  groom: string;
  date: string;
  venue: string;
  /** টাকা ওঠানোর লক্ষ্য */
  target: number;
  /** খরচের বাজেট */
  budget: number;
}

export interface AppData {
  version: number;
  event: EventInfo;
  contributions: Contribution[];
  expenses: Expense[];
}

interface Option<T extends string> {
  id: T;
  label: string;
  color: string;
}

export const SIDES: Option<Side>[] = [
  { id: 'groom', label: 'বরের পক্ষ', color: '#7a1730' },
  { id: 'bride', label: 'কনের পক্ষ', color: '#c9822f' },
];

export const RELATIONS: Option<Relation>[] = [
  { id: 'relative', label: 'আত্মীয়', color: '#7a1730' },
  { id: 'friend', label: 'বন্ধু', color: '#c9822f' },
  { id: 'neighbour', label: 'প্রতিবেশী', color: '#4f7a5a' },
  { id: 'colleague', label: 'সহকর্মী', color: '#3f6a8a' },
  { id: 'teacher', label: 'শিক্ষক', color: '#8a5a9e' },
  { id: 'other', label: 'অন্যান্য', color: '#9c8a8f' },
];

export const METHODS: Option<Method>[] = [
  { id: 'cash', label: 'নগদ', color: '#4f7a5a' },
  { id: 'bkash', label: 'বিকাশ', color: '#c0396f' },
  { id: 'nagad', label: 'নগদ (নগদ অ্যাপ)', color: '#c9822f' },
  { id: 'rocket', label: 'রকেট', color: '#8a5a9e' },
  { id: 'bank', label: 'ব্যাংক', color: '#3f6a8a' },
  { id: 'cheque', label: 'চেক', color: '#7a1730' },
];

export const EXPENSE_CATEGORIES: (Option<ExpenseCategory> & { icon: LucideIcon })[] = [
  { id: 'food', label: 'খাবার ও ক্যাটারিং', color: '#c9822f', icon: UtensilsCrossed },
  { id: 'venue', label: 'হল ও ভেন্যু', color: '#7a1730', icon: Landmark },
  { id: 'decor', label: 'সাজসজ্জা', color: '#c0396f', icon: Flower2 },
  { id: 'clothing', label: 'পোশাক', color: '#8a5a9e', icon: Shirt },
  { id: 'jewelry', label: 'গহনা', color: '#d4a017', icon: Gem },
  { id: 'photo', label: 'ফটোগ্রাফি', color: '#3f6a8a', icon: Camera },
  { id: 'music', label: 'সংগীত ও বাদ্যদল', color: '#4f7a5a', icon: Music4 },
  { id: 'transport', label: 'যাতায়াত ও গাড়ি', color: '#6b7a8a', icon: Car },
  { id: 'other', label: 'অন্যান্য', color: '#9c8a8f', icon: Package },
];

export function labelOf<T extends string>(options: Option<T>[], id: T): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function colorOf<T extends string>(options: Option<T>[], id: T): string {
  return options.find((option) => option.id === id)?.color ?? '#9c8a8f';
}
