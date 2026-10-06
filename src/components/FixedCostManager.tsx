import React, { useState, useEffect, useMemo } from 'react';
import { 
  Repeat, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  AlertCircle, 
  Calendar, 
  Tag, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Clock, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckSquare,
  Square,
  X,
  Layers,
  Home,
  Zap,
  ShoppingCart,
  GraduationCap,
  Smartphone,
  Utensils,
  HeartPulse,
  Tv,
  Filter,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LanguageType } from '../translations';

export interface FixedCostItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  dueDay: number; // Day of month 1 - 31
  note?: string;
  isActive: boolean;
  paidMonths?: Record<string, boolean>; // key: `${year}-${month}` (e.g. "2026-8")
}

interface FixedCostManagerProps {
  transactions: {
    id: string;
    amount: number;
    category: string;
    date: string;
    description: string;
    type: 'income' | 'expense';
  }[];
  onApplyFixedCosts: (itemsToAdd: {
    amount: number;
    category: string;
    date: string;
    description: string;
    type: 'income' | 'expense';
  }[]) => void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  currency?: string;
  language?: LanguageType;
}

const DEMO_PRESET_TITLES = new Set([
  'house rent', 'বাসা ভাড়া',
  'electricity bill', 'বিদ্যুৎ বিল',
  'wifi & internet', 'ওয়াইফাই ইন্টারনেট',
  'gas & water', 'গ্যাস ও পানি বিল',
  'tuition / school', 'টিউশনি / স্কুল ফি',
  'maid / helper', 'কাজের বুয়া বেতন',
  'mobile postpaid', 'মোবাইল রিচার্জ / বিল',
  'streaming / sub', 'সাবস্ক্রিপশন'
]);

const isDemoItem = (item: FixedCostItem): boolean => {
  if (!item || typeof item !== 'object') return true;
  if (!item.id || item.id === 'fc-1' || item.id === 'fc-2' || item.id === 'fc-3' || item.id.startsWith('demo-')) {
    return true;
  }
  const titleLower = (item.title || '').trim().toLowerCase();
  if (!titleLower) return true;
  if (DEMO_PRESET_TITLES.has(titleLower)) return true;
  const noteLower = (item.note || '').trim().toLowerCase();
  if (['monthly apartment rent', 'broadband connection', 'desco / dpdc'].includes(noteLower)) return true;
  return false;
};

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const getCategoryIcon = (cat: string) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('rent') || c.includes('ভাড়া') || c.includes('বাসা')) return <Home size={18} />;
  if (c.includes('util') || c.includes('বিদ্যুৎ') || c.includes('গ্যাস') || c.includes('পানি') || c.includes('bill')) return <Zap size={18} />;
  if (c.includes('bazar') || c.includes('বাজার') || c.includes('shop') || c.includes('grocery')) return <ShoppingCart size={18} />;
  if (c.includes('tuit') || c.includes('পড়াশোনা') || c.includes('school') || c.includes('ফি') || c.includes('study')) return <GraduationCap size={18} />;
  if (c.includes('mobile') || c.includes('phone') || c.includes('ফোন') || c.includes('রিচার্জ') || c.includes('recharge')) return <Smartphone size={18} />;
  if (c.includes('food') || c.includes('খাবার') || c.includes('dining')) return <Utensils size={18} />;
  if (c.includes('health') || c.includes('মেডিকেল') || c.includes('স্বাস্থ্য') || c.includes('doctor')) return <HeartPulse size={18} />;
  if (c.includes('entertain') || c.includes('বিনোদন') || c.includes('stream') || c.includes('sub')) return <Tv size={18} />;
  return <Tag size={18} />;
};

const getCategoryColor = (cat: string) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('rent') || c.includes('ভাড়া') || c.includes('বাসা')) return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
  if (c.includes('util') || c.includes('বিদ্যুৎ') || c.includes('গ্যাস') || c.includes('পানি')) return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
  if (c.includes('bazar') || c.includes('বাজার') || c.includes('shop')) return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
  if (c.includes('tuit') || c.includes('পড়াশোনা') || c.includes('school')) return 'bg-purple-500/15 text-purple-500 border-purple-500/30';
  if (c.includes('mobile') || c.includes('phone') || c.includes('রিচার্জ')) return 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30';
  if (c.includes('food') || c.includes('খাবার')) return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
  if (c.includes('health') || c.includes('স্বাস্থ্য')) return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
  if (c.includes('entertain') || c.includes('বিনোদন')) return 'bg-violet-500/15 text-violet-500 border-violet-500/30';
  return 'bg-accent/15 text-accent border-accent/30';
};

export function FixedCostManager({
  transactions,
  onApplyFixedCosts,
  onDeleteTransaction,
  currency = '৳',
  language = 'en'
}: FixedCostManagerProps) {
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>(() => {
    try {
      const saved = localStorage.getItem('finflow_fixed_costs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly filter out any demo items
          return parsed.filter((item: FixedCostItem) => !isDemoItem(item));
        }
      }
    } catch (e) {
      console.error("Failed to load fixed costs", e);
    }
    return [];
  });

  const now = new Date();
  const currentCalendarYear = now.getFullYear();
  const currentCalendarMonth = now.getMonth(); // 0-indexed

  // Currently focused target month in the Monthly Fixed Costs section
  const [targetYear, setTargetYear] = useState<number>(currentCalendarYear);
  const [targetMonth, setTargetMonth] = useState<number>(currentCalendarMonth);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Modal states for applying to other months
  const [singleApplyModalItem, setSingleApplyModalItem] = useState<FixedCostItem | null>(null);
  const [isBulkApplyModalOpen, setIsBulkApplyModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [dueDay, setDueDay] = useState<string>('1');
  const [note, setNote] = useState('');
  const [formIsPaid, setFormIsPaid] = useState<boolean>(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('finflow_fixed_costs', JSON.stringify(fixedCosts));
      window.dispatchEvent(new Event('finflow_fixed_costs_updated'));
    } catch (e) {
      console.error("Failed to save fixed costs", e);
    }
  }, [fixedCosts]);

  // Support physical/system Android Back button for sub-modals & open forms
  useEffect(() => {
    const handleBackEvent = (e: Event) => {
      if (singleApplyModalItem) {
        e.preventDefault();
        setSingleApplyModalItem(null);
        return;
      }
      if (isBulkApplyModalOpen) {
        e.preventDefault();
        setIsBulkApplyModalOpen(false);
        return;
      }
      if (showClearConfirm) {
        e.preventDefault();
        setShowClearConfirm(false);
        return;
      }
      if (isFormOpen) {
        e.preventDefault();
        setIsFormOpen(false);
        setEditingId(null);
        return;
      }
    };
    window.addEventListener('app-back-button', handleBackEvent);
    return () => window.removeEventListener('app-back-button', handleBackEvent);
  }, [singleApplyModalItem, isBulkApplyModalOpen, showClearConfirm, isFormOpen]);

  // Format numbers nicely
  const formatNum = (num: number) => {
    try {
      return num.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
    } catch {
      return num.toString();
    }
  };

  // Helper to determine due alert for a fixed cost item
  const getDueAlert = (dueDay: number, isPaid: boolean, y: number, m: number) => {
    if (isPaid) return null;

    const curY = currentCalendarYear;
    const curM = currentCalendarMonth;
    const curD = new Date().getDate();

    // Past month
    if (y < curY || (y === curY && m < curM)) {
      return {
        type: 'overdue' as const,
        labelEn: '⚠️ Past Due',
        labelBn: '⚠️ অতিক্রান্ত',
        badgeClass: 'bg-rose-100 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-extrabold'
      };
    }

    // Future month
    if (y > curY || (y === curY && m > curM)) {
      return null;
    }

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const targetDay = Math.min(dueDay, daysInMonth);
    const diff = targetDay - curD;

    if (diff === 0) {
      return {
        type: 'today' as const,
        labelEn: '⚡ Due Today!',
        labelBn: '⚡ আজ পরিশোধের দিন!',
        badgeClass: 'bg-amber-100 dark:bg-amber-950/90 text-amber-950 dark:text-amber-200 border-amber-400 dark:border-amber-600 font-black animate-pulse'
      };
    } else if (diff === 1) {
      return {
        type: 'tomorrow' as const,
        labelEn: '⏰ 1 Day Remaining (Tomorrow)',
        labelBn: '⏰ ১ দিন বাকি (আগামীকাল)',
        badgeClass: 'bg-amber-100 dark:bg-amber-950/90 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-black animate-pulse'
      };
    } else if (diff > 1 && diff <= 7) {
      return {
        type: 'week' as const,
        labelEn: `🗓️ ${diff} Days Remaining (~1 week)`,
        labelBn: `🗓️ আর ${formatNum(diff)} দিন বাকি (~১ সপ্তাহ)`,
        badgeClass: 'bg-sky-100 dark:bg-sky-950/80 text-sky-950 dark:text-sky-200 border-sky-300 dark:border-sky-700 font-bold'
      };
    } else if (diff < 0) {
      return {
        type: 'overdue' as const,
        labelEn: `⚠️ Overdue (${Math.abs(diff)}d ago)`,
        labelBn: `⚠️ ${formatNum(Math.abs(diff))} দিন আগে পার হয়েছে`,
        badgeClass: 'bg-rose-100 dark:bg-rose-950/90 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-black'
      };
    }
    return null;
  };

  const getMonthName = (monthIdx: number, yearNum: number) => {
    const monthStr = language === 'bn' ? MONTH_NAMES_BN[monthIdx] : MONTH_NAMES_EN[monthIdx];
    const yearStr = language === 'bn' 
      ? String(yearNum).split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
      : String(yearNum);
    return `${monthStr} ${yearStr}`;
  };

  const targetMonthName = getMonthName(targetMonth, targetYear);
  const isTargetCurrentCalendarMonth = targetYear === currentCalendarYear && targetMonth === currentCalendarMonth;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (targetMonth === 0) {
      setTargetMonth(11);
      setTargetYear(prev => prev - 1);
    } else {
      setTargetMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (targetMonth === 11) {
      setTargetMonth(0);
      setTargetYear(prev => prev + 1);
    } else {
      setTargetMonth(prev => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setTargetYear(currentCalendarYear);
    setTargetMonth(currentCalendarMonth);
  };

  // User explicitly controls whether an item is Paid or Not Paid for a given month (NOT automatically done)
  const isItemPaid = (item: FixedCostItem, y: number, m: number): boolean => {
    const key = `${y}-${m}`;
    if (item.paidMonths && item.paidMonths[key] !== undefined) {
      return item.paidMonths[key];
    }
    return false; // Default to unpaid (Not Paid) - explicit user control
  };

  const totalMonthlyCommitment = fixedCosts
    .filter(i => i.isActive)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const paidItemsCount = fixedCosts.filter(i => i.isActive && isItemPaid(i, targetYear, targetMonth)).length;
  const unpaidItemsCount = fixedCosts.filter(i => i.isActive && !isItemPaid(i, targetYear, targetMonth)).length;

  const paidAmount = useMemo(() => {
    return fixedCosts
      .filter(i => i.isActive && isItemPaid(i, targetYear, targetMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [fixedCosts, targetYear, targetMonth]);

  const unpaidAmount = useMemo(() => {
    return fixedCosts
      .filter(i => i.isActive && !isItemPaid(i, targetYear, targetMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [fixedCosts, targetYear, targetMonth]);

  const filteredFixedCosts = useMemo(() => {
    return fixedCosts.filter(item => {
      if (statusFilter === 'all') return true;
      const isPaid = isItemPaid(item, targetYear, targetMonth);
      if (statusFilter === 'paid') return isPaid;
      if (statusFilter === 'unpaid') return !isPaid;
      return true;
    });
  }, [fixedCosts, statusFilter, targetYear, targetMonth]);

  const dueSoonItems = useMemo(() => {
    return fixedCosts.filter(item => {
      if (!item.isActive || isItemPaid(item, targetYear, targetMonth)) return false;
      const alert = getDueAlert(item.dueDay, false, targetYear, targetMonth);
      return alert !== null;
    });
  }, [fixedCosts, targetYear, targetMonth]);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const parsedDue = parseInt(dueDay, 10);
    const validDueDay = isNaN(parsedDue) ? 1 : Math.min(31, Math.max(1, parsedDue));
    const monthKey = `${targetYear}-${targetMonth}`;

    if (editingId) {
      setFixedCosts(prev => prev.map(item => {
        if (item.id === editingId) {
          const updatedPaidMonths = {
            ...(item.paidMonths || {}),
            [monthKey]: formIsPaid
          };
          return {
            ...item,
            title: title.trim(),
            amount: parsedAmount,
            category,
            dueDay: validDueDay,
            note: note.trim(),
            paidMonths: updatedPaidMonths
          };
        }
        return item;
      }));
    } else {
      const newItem: FixedCostItem = {
        id: 'fc-' + Date.now(),
        title: title.trim(),
        amount: parsedAmount,
        category,
        dueDay: validDueDay,
        note: note.trim(),
        isActive: true,
        paidMonths: { [monthKey]: formIsPaid }
      };
      setFixedCosts(prev => [...prev, newItem]);
    }

    // Handle transaction syncing based on formIsPaid choice
    if (formIsPaid) {
      const alreadyHasTx = transactions.some(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const parts = t.date.split('-');
        if (parts.length >= 2) {
          const transY = parseInt(parts[0], 10);
          const transM = parseInt(parts[1], 10) - 1;
          if (transY !== targetYear || transM !== targetMonth) return false;
        }
        return (t.description || '').toLowerCase() === title.trim().toLowerCase();
      });

      if (!alreadyHasTx) {
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const day = Math.min(validDueDay, daysInMonth);
        const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onApplyFixedCosts([{
          amount: parsedAmount,
          category,
          date: dateStr,
          description: title.trim(),
          type: 'expense'
        }]);
      }
    } else if (editingId && onDeleteTransaction) {
      const matchingTx = transactions.find(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const parts = t.date.split('-');
        if (parts.length >= 2) {
          const transY = parseInt(parts[0], 10);
          const transM = parseInt(parts[1], 10) - 1;
          if (transY !== targetYear || transM !== targetMonth) return false;
        }
        return (t.description || '').toLowerCase() === title.trim().toLowerCase();
      });
      if (matchingTx && matchingTx.id) {
        onDeleteTransaction(matchingTx.id);
      }
    }

    // Reset
    setTitle('');
    setAmount('');
    setCategory('Rent');
    setDueDay('1');
    setNote('');
    setFormIsPaid(false);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const startEdit = (item: FixedCostItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDueDay(item.dueDay ? item.dueDay.toString() : '1');
    setNote(item.note || '');
    setFormIsPaid(isItemPaid(item, targetYear, targetMonth));
    setIsFormOpen(true);
  };

  const deleteItem = (id: string) => {
    setFixedCosts(prev => prev.filter(i => i.id !== id));
  };

  // Explicit user action: Set Paid or Not Paid for a cost in a specific month
  const handleSetPaidStatus = async (item: FixedCostItem, y: number, m: number, shouldBePaid: boolean) => {
    const key = `${y}-${m}`;

    // 1. Update fixed costs state
    setFixedCosts(prev => prev.map(fc => {
      if (fc.id !== item.id) return fc;
      const updatedPaidMonths = { ...(fc.paidMonths || {}), [key]: shouldBePaid };
      return { ...fc, paidMonths: updatedPaidMonths };
    }));

    const monthLabel = getMonthName(m, y);

    if (shouldBePaid) {
      // Check if a transaction for this item in this month already exists
      const existingTx = transactions.some(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const parts = t.date.split('-');
        if (parts.length >= 2) {
          const transY = parseInt(parts[0], 10);
          const transM = parseInt(parts[1], 10) - 1;
          if (transY !== y || transM !== m) return false;
        }
        return (t.description || '').toLowerCase() === item.title.toLowerCase();
      });

      if (!existingTx) {
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const day = Math.min(item.dueDay, daysInMonth);
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        onApplyFixedCosts([{
          amount: item.amount,
          category: item.category,
          date: dateStr,
          description: item.title,
          type: 'expense'
        }]);
      }

      setApplySuccessMessage(
        language === 'en'
          ? `Marked "${item.title}" as Paid for ${monthLabel}.`
          : `"${item.title}" ${monthLabel}-এর জন্য পরিশোধিত হিসেবে চিহ্নিত হয়েছে।`
      );
    } else {
      // Mark as Not Paid: remove corresponding transaction if one was recorded
      if (onDeleteTransaction) {
        const matchingTx = transactions.find(t => {
          if (t.type !== 'expense' || !t.date) return false;
          const parts = t.date.split('-');
          if (parts.length >= 2) {
            const transY = parseInt(parts[0], 10);
            const transM = parseInt(parts[1], 10) - 1;
            if (transY !== y || transM !== m) return false;
          }
          return (t.description || '').toLowerCase() === item.title.toLowerCase();
        });

        if (matchingTx && matchingTx.id) {
          await onDeleteTransaction(matchingTx.id);
        }
      }

      setApplySuccessMessage(
        language === 'en'
          ? `Marked "${item.title}" as Not Paid for ${monthLabel}.`
          : `"${item.title}" ${monthLabel}-এর জন্য অপরিশোধিত হিসেবে চিহ্নিত হয়েছে।`
      );
    }

    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  // Mark all unpaid active fixed costs as Paid for target month
  const markAllUnpaidAsPaid = () => {
    const key = `${targetYear}-${targetMonth}`;
    const unpaids = fixedCosts.filter(i => i.isActive && !isItemPaid(i, targetYear, targetMonth));
    if (unpaids.length === 0) return;

    setFixedCosts(prev => prev.map(fc => {
      if (!fc.isActive) return fc;
      return {
        ...fc,
        paidMonths: { ...(fc.paidMonths || {}), [key]: true }
      };
    }));

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const itemsToAdd = unpaids.filter(item => {
      return !transactions.some(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const parts = t.date.split('-');
        if (parts.length >= 2) {
          const transY = parseInt(parts[0], 10);
          const transM = parseInt(parts[1], 10) - 1;
          if (transY !== targetYear || transM !== targetMonth) return false;
        }
        return (t.description || '').toLowerCase() === item.title.toLowerCase();
      });
    }).map(item => {
      const day = Math.min(item.dueDay, daysInMonth);
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        amount: item.amount,
        category: item.category,
        date: dateStr,
        description: item.title,
        type: 'expense' as const
      };
    });

    if (itemsToAdd.length > 0) {
      onApplyFixedCosts(itemsToAdd);
    }

    setApplySuccessMessage(
      language === 'en'
        ? `Marked ${unpaids.length} fixed cost(s) as Paid for ${targetMonthName}!`
        : `${targetMonthName}-এর জন্য ${unpaids.length}টি খরচ পরিশোধিত হিসেবে চিহ্নিত করা হয়েছে!`
    );
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  // Mark all paid fixed costs as Not Paid for target month
  const markAllPaidAsUnpaid = async () => {
    const key = `${targetYear}-${targetMonth}`;
    const paids = fixedCosts.filter(i => i.isActive && isItemPaid(i, targetYear, targetMonth));
    if (paids.length === 0) return;

    setFixedCosts(prev => prev.map(fc => {
      if (!fc.isActive) return fc;
      return {
        ...fc,
        paidMonths: { ...(fc.paidMonths || {}), [key]: false }
      };
    }));

    if (onDeleteTransaction) {
      for (const item of paids) {
        const matchingTx = transactions.find(t => {
          if (t.type !== 'expense' || !t.date) return false;
          const parts = t.date.split('-');
          if (parts.length >= 2) {
            const transY = parseInt(parts[0], 10);
            const transM = parseInt(parts[1], 10) - 1;
            if (transY !== targetYear || transM !== targetMonth) return false;
          }
          return (t.description || '').toLowerCase() === item.title.toLowerCase();
        });
        if (matchingTx && matchingTx.id) {
          await onDeleteTransaction(matchingTx.id);
        }
      }
    }

    setApplySuccessMessage(
      language === 'en'
        ? `Reset ${paids.length} fixed cost(s) to Not Paid for ${targetMonthName}.`
        : `${targetMonthName}-এর জন্য ${paids.length}টি খরচ অপরিশোধিত করা হয়েছে।`
    );
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  // Helper to update paidMonths for a specific item across multiple month keys
  const handleUpdateItemPaidMonths = (itemId: string, monthKeys: string[], isPaid: boolean) => {
    setFixedCosts(prev => prev.map(fc => {
      if (fc.id !== itemId) return fc;
      const updated = { ...(fc.paidMonths || {}) };
      monthKeys.forEach(k => {
        updated[k] = isPaid;
      });
      return { ...fc, paidMonths: updated };
    }));
  };

  // Helper to update paidMonths for multiple items for a specific month key
  const handleUpdateMultipleItemsPaid = (itemIds: string[], monthKey: string, isPaid: boolean) => {
    setFixedCosts(prev => prev.map(fc => {
      if (!itemIds.includes(fc.id)) return fc;
      return {
        ...fc,
        paidMonths: { ...(fc.paidMonths || {}), [monthKey]: isPaid }
      };
    }));
  };

  // Generate list of available upcoming and past years
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentCalendarYear - 2; y <= currentCalendarYear + 5; y++) {
      years.push(y);
    }
    return years;
  }, [currentCalendarYear]);

  return (
    <div className="space-y-6">
      {/* 1. Target Month Navigation Header Bar */}
      <div className="p-4 sm:p-5 rounded-3xl glass-card border border-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0 shadow-xs">
            <CalendarDays size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {language === 'en' ? 'Target Month' : 'নির্ধারিত মাস'}
              </span>
              {!isTargetCurrentCalendarMonth && (
                <button
                  type="button"
                  onClick={handleResetToCurrentMonth}
                  className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Jump to Current Month' : 'চলতি মাসে ফিরুন'}
                </button>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
              {targetMonthName}
            </h2>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-glass p-1.5 rounded-2xl border border-glass-border">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
            title={language === 'en' ? 'Previous Month' : 'পূর্ববর্তী মাস'}
          >
            <ChevronLeft size={16} />
          </button>

          <select
            value={targetMonth}
            onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))}
            className="bg-transparent text-xs sm:text-sm font-bold text-primary px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
          >
            {(language === 'bn' ? MONTH_NAMES_BN : MONTH_NAMES_EN).map((name, idx) => (
              <option key={idx} value={idx} className="bg-bg-deep text-primary">
                {name}
              </option>
            ))}
          </select>

          <select
            value={targetYear}
            onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
            className="bg-transparent text-xs sm:text-sm font-bold text-primary px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
          >
            {availableYears.map(y => {
              const yearLabel = language === 'bn'
                ? String(y).split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                : String(y);
              return (
                <option key={y} value={y} className="bg-bg-deep text-primary">
                  {yearLabel}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
            title={language === 'en' ? 'Next Month' : 'পরবর্তী মাস'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {applySuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
          <span>{applySuccessMessage}</span>
        </div>
      )}

      {/* 2. KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Monthly Commitment */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-glass-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted">
              {language === 'en' ? 'Total Commitment' : 'মোট নির্দিষ্ট খরচ'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Repeat size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight tabular-nums">
              {currency}{formatNum(totalMonthlyCommitment)}
            </div>
            <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1.5 font-medium">
              <span>{fixedCosts.filter(i => i.isActive).length} {language === 'en' ? 'recurring items' : 'টি মাসিক খরচ'}</span>
              <span>•</span>
              <span className="text-accent font-bold">{language === 'en' ? 'every month' : 'প্রতি মাসে'}</span>
            </p>
          </div>
        </div>

        {/* Paid This Month */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-glass-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {language === 'en' ? 'Paid for this Month' : 'এই মাসে পরিশোধিত'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
              {currency}{formatNum(paidAmount)}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted">
                <span>{paidItemsCount} {language === 'en' ? 'of' : 'এর মধ্যে'} {fixedCosts.filter(i => i.isActive).length} {language === 'en' ? 'settled' : 'পরিশোধিত'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {totalMonthlyCommitment > 0 ? Math.round((paidAmount / totalMonthlyCommitment) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-glass overflow-hidden border border-glass-border/40">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalMonthlyCommitment > 0 ? Math.min(100, Math.round((paidAmount / totalMonthlyCommitment) * 100)) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Remaining Due */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-glass-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {language === 'en' ? 'Remaining Due' : 'বাকি অপরিশোধিত'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">
              {currency}{formatNum(unpaidAmount)}
            </div>
            <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1 font-medium">
              {unpaidItemsCount === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ {language === 'en' ? 'All cleared for this month!' : 'এই মাসের সব পরিশোধিত!'}
                </span>
              ) : (
                <span>
                  {unpaidItemsCount} {language === 'en' ? 'item(s) pending payment' : 'টি খরচ এখনও বাকি'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar & Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-glass border border-glass-border self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              statusFilter === 'all'
                ? "bg-accent text-white shadow-xs"
                : "text-muted hover:text-primary"
            )}
          >
            {language === 'en' ? 'All' : 'সব'} ({fixedCosts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unpaid')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              statusFilter === 'unpaid'
                ? "bg-rose-500 text-white shadow-xs"
                : "text-muted hover:text-rose-400"
            )}
          >
            <XCircle size={13} />
            <span>{language === 'en' ? 'Unpaid' : 'অপরিশোধিত'}</span>
            <span className="ml-0.5">({unpaidItemsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              statusFilter === 'paid'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted hover:text-emerald-400"
            )}
          >
            <CheckCircle2 size={13} />
            <span>{language === 'en' ? 'Paid' : 'পরিশোধিত'}</span>
            <span className="ml-0.5">({paidItemsCount})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {unpaidItemsCount > 0 ? (
            <button
              type="button"
              onClick={markAllUnpaidAsPaid}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>{language === 'en' ? `Mark All Paid (${unpaidItemsCount})` : `সব পরিশোধিত (${unpaidItemsCount})`}</span>
            </button>
          ) : fixedCosts.length > 0 && (
            <button
              type="button"
              onClick={markAllPaidAsUnpaid}
              className="px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-400 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{language === 'en' ? 'Reset to Unpaid' : 'সব অপরিশোধিত করুন'}</span>
            </button>
          )}

          {fixedCosts.some(i => i.isActive) && (
            <button
              type="button"
              onClick={() => setIsBulkApplyModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-glass border border-glass-border hover:border-accent/40 text-primary text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CalendarDays size={14} className="text-accent" />
              <span>{language === 'en' ? 'Apply to Other Months...' : 'অন্য মাসে যোগ করুন...'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isFormOpen) {
                setIsFormOpen(false);
                setEditingId(null);
              } else {
                setTitle('');
                setAmount('');
                setCategory('Rent');
                setDueDay('1');
                setNote('');
                setFormIsPaid(false);
                setEditingId(null);
                setIsFormOpen(true);
              }
            }}
            className="px-4 py-2 rounded-2xl bg-accent hover:bg-accent/90 text-white text-xs font-bold shadow-md shadow-accent/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={15} className={cn("transition-transform", isFormOpen && "rotate-45")} />
            <span>{isFormOpen 
              ? (language === 'en' ? 'Close Form' : 'ফর্ম বন্ধ করুন') 
              : (language === 'en' ? 'Add Fixed Cost' : 'নতুন খরচ যোগ করুন')}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Add / Edit Form Modal / Panel */}
      {isFormOpen && (
        <form onSubmit={handleSaveItem} className="glass-card border border-accent/35 rounded-3xl p-5 sm:p-7 space-y-5 animate-in shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-glass-border">
            <h4 className="font-bold text-base text-primary flex items-center gap-2">
              <Calendar size={18} className="text-accent" />
              {editingId 
                ? (language === 'en' ? 'Edit Monthly Fixed Cost' : 'নির্দিষ্ট খরচ সম্পাদনা') 
                : (language === 'en' ? 'Add New Monthly Fixed Cost' : 'নতুন মাসিক নির্দিষ্ট খরচ যোগ করুন')}
            </h4>
            <span className="text-[11px] text-muted font-medium">
              {language === 'en' ? `Target: ${targetMonthName}` : `লক্ষ্য: ${targetMonthName}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {language === 'en' ? 'Expense Title / Name *' : 'খরচের নাম *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'en' ? 'e.g. Apartment Rent' : 'যেমনঃ বাসা ভাড়া'}
                className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-primary focus:outline-none focus:border-accent/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {language === 'en' ? 'Monthly Amount *' : 'মাসিক পরিমাণ *'} ({currency})
              </label>
              <input
                type="number"
                required
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {language === 'en' ? 'Category' : 'ক্যাটাগরি'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-primary focus:outline-none focus:border-accent/60"
              >
                <option value="Rent" className="bg-bg-deep text-primary">Rent / বাসা ভাড়া</option>
                <option value="Utilities" className="bg-bg-deep text-primary">Utilities / বিদ্যুৎ-গ্যাস-পানি</option>
                <option value="Bazar" className="bg-bg-deep text-primary">Bazar / মাসিক বাজার</option>
                <option value="Tuition" className="bg-bg-deep text-primary">Tuition / পড়াশোনা</option>
                <option value="Mobile Recharge" className="bg-bg-deep text-primary">Mobile Recharge / ফোন বিল</option>
                <option value="Food" className="bg-bg-deep text-primary">Food / খাবার</option>
                <option value="Health" className="bg-bg-deep text-primary">Health / স্বাস্থ্য ও ঔষধ</option>
                <option value="Entertainment" className="bg-bg-deep text-primary">Entertainment / বিনোদন</option>
                <option value="Other" className="bg-bg-deep text-primary">Other / অন্যান্য</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {language === 'en' ? 'Default Due Day' : 'পরিশোধের তারিখ'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => {
                    if (dueDay === '') {
                      setDueDay('1');
                    } else {
                      const val = parseInt(dueDay, 10);
                      if (isNaN(val) || val < 1) {
                        setDueDay('1');
                      } else if (val > 31) {
                        setDueDay('31');
                      } else {
                        setDueDay(val.toString());
                      }
                    }
                  }}
                  placeholder="1-31"
                  className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent/60"
                />
                <span className="text-xs text-muted font-medium whitespace-nowrap">
                  {language === 'en' ? 'of month' : 'তারিখ'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {language === 'en' ? 'Note / Details (Optional)' : 'বিবরণ / নোট (ঐচ্ছিক)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Account number, landlord name, reference' : 'যেমনঃ মিটার নম্বর, বাড়িওয়ালার নাম, রেফারেন্স'}
              className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-accent/60"
            />
          </div>

          {/* Payment Status Segment for Target Month */}
          <div className="p-4 rounded-2xl bg-bg-deep/70 border border-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-accent" />
                {language === 'en' 
                  ? `Payment Status for ${targetMonthName}:` 
                  : `${targetMonthName}-এর জন্য পরিশোধের অবস্থা:`}
              </span>
              <p className="text-[11px] text-muted mt-0.5">
                {language === 'en' 
                  ? 'Determine if this bill is already paid for the selected month.' 
                  : 'এই মাসের জন্য খরচটি ইতিমধ্যে পরিশোধ করা হয়েছে কি না নির্বাচন করুন।'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/90 dark:bg-bg-deep border border-slate-300 dark:border-glass-border shrink-0 shadow-inner">
              <button
                type="button"
                onClick={() => setFormIsPaid(false)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                  !formIsPaid
                    ? "bg-rose-600 text-white border border-rose-700 shadow-md ring-1 ring-rose-400/50"
                    : "text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 font-bold"
                )}
              >
                <XCircle size={14} className={cn("shrink-0", !formIsPaid ? "text-white" : "text-rose-700 dark:text-rose-400")} />
                <span className={cn(!formIsPaid ? "text-white font-black" : "font-bold")}>
                  {language === 'en' ? 'Not Paid' : 'অপরিশোধিত'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormIsPaid(true)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                  formIsPaid
                    ? "bg-emerald-600 text-white border border-emerald-700 shadow-md ring-1 ring-emerald-400/50"
                    : "text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 font-bold"
                )}
              >
                <CheckCircle2 size={14} className={cn("shrink-0", formIsPaid ? "text-white" : "text-emerald-700 dark:text-emerald-400")} />
                <span className={cn(formIsPaid ? "text-white font-black" : "font-bold")}>
                  {language === 'en' ? 'Paid' : 'পরিশোধিত'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  deleteItem(editingId);
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title={language === 'en' ? 'Delete this fixed cost' : 'এই নির্দিষ্ট খরচটি মুছে ফেলুন'}
              >
                <Trash2 size={14} />
                <span>{language === 'en' ? 'Delete' : 'মুছে ফেলুন'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-glass-border text-xs font-bold text-muted hover:text-primary transition-all cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent/90 text-xs font-bold shadow-md shadow-accent/20 transition-all cursor-pointer"
              >
                {editingId 
                  ? (language === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ') 
                  : (language === 'en' ? 'Save Fixed Cost' : 'খরচ সংরক্ষণ করুন')}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 5. Organized Cost Cards Section */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted">
              {language === 'en' ? 'Configured Monthly Costs' : 'সংরক্ষিত নির্দিষ্ট খরচসমূহ'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-black">
              {filteredFixedCosts.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {fixedCosts.length > 0 && (
              !showClearConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                  title={language === 'en' ? 'Delete all configured fixed costs' : 'সকল নির্দিষ্ট খরচ মুছে ফেলুন'}
                >
                  <Trash2 size={13} />
                  <span>{language === 'en' ? 'Clear All' : 'সব মুছুন'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-lg text-xs">
                  <span className="text-rose-300 font-medium">
                    {language === 'en' ? 'Clear all?' : 'সব মুছবেন?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFixedCosts([]);
                      setShowClearConfirm(false);
                      try {
                        localStorage.removeItem('finflow_fixed_costs');
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="font-bold text-rose-300 hover:text-white underline ml-1 cursor-pointer"
                  >
                    {language === 'en' ? 'Yes' : 'হ্যাঁ'}
                  </button>
                  <span className="text-rose-400/60">/</span>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="text-muted hover:text-primary cursor-pointer"
                  >
                    {language === 'en' ? 'No' : 'না'}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredFixedCosts.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl glass-card border border-glass-border text-center space-y-3">
            <Repeat size={36} className="mx-auto text-muted opacity-40" />
            <h4 className="text-base font-bold text-primary">
              {statusFilter === 'all' 
                ? (language === 'en' ? 'No monthly fixed costs configured' : 'এখনও কোনো নির্দিষ্ট খরচ যোগ করা হয়নি')
                : statusFilter === 'unpaid'
                  ? (language === 'en' ? 'No unpaid costs for this month!' : 'এই মাসে কোনো অপরিশোধিত খরচ নেই!')
                  : (language === 'en' ? 'No paid costs yet for this month' : 'এই মাসে এখনও কোনো পরিশোধিত খরচ নেই')}
            </h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {statusFilter === 'all'
                ? (language === 'en' ? 'Add recurring commitments (Rent, Utilities, Internet, Tuition) to track them effortlessly.' : 'আপনার নিয়মিত খরচগুলো যুক্ত করুন এবং প্রতি মাসে সহজে হিসাব রাখুন।')
                : (language === 'en' ? 'Switch filter to view all items or add new costs.' : 'সব খরচ দেখতে ফিল্টার পরিবর্তন করুন বা নতুন খরচ যোগ করুন।')}
            </p>
            {statusFilter === 'all' && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md cursor-pointer hover:bg-accent/90 transition-all mt-2"
              >
                <Plus size={14} />
                <span>{language === 'en' ? 'Add Your First Fixed Cost' : 'প্রথম নির্দিষ্ট খরচ যোগ করুন'}</span>
              </button>
            )}
          </div>
        ) : (
          /* Cost Cards Grid with Clean Visual Hierarchy */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredFixedCosts.map((item) => {
              const isPaid = isItemPaid(item, targetYear, targetMonth);
              const urgency = getDueAlert(item.dueDay, isPaid, targetYear, targetMonth);

              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-4 sm:p-5 rounded-3xl glass-card border transition-all duration-200 flex flex-col justify-between gap-4 relative overflow-hidden group shadow-sm",
                    isPaid 
                      ? "border-emerald-500/30 hover:border-emerald-500/50" 
                      : "border-glass-border hover:border-accent/40"
                  )}
                >
                  {/* Left status accent strip */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
                    isPaid ? "bg-emerald-500" : "bg-amber-500"
                  )} />

                  {/* Tier 1: Header - Title, Category Icon & Big Amount */}
                  <div className="flex items-start justify-between gap-3 pl-1">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-colors",
                        getCategoryColor(item.category)
                      )}>
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-extrabold text-base text-primary truncate leading-tight">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-glass border border-glass-border font-bold text-muted">
                            {item.category}
                          </span>
                          {item.note && (
                            <span className="text-[11px] text-muted truncate max-w-[160px] italic">
                              {item.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Frequency */}
                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-black text-primary tabular-nums tracking-tight">
                        {currency}{formatNum(item.amount)}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted mt-0.5">
                        {language === 'en' ? 'per month' : 'প্রতি মাস'}
                      </div>
                    </div>
                  </div>

                  {/* Tier 2: Timeline & Status Row */}
                  <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-2xl bg-glass border border-glass-border/60 flex-wrap text-xs">
                    {/* Due Date */}
                    <div className="flex items-center gap-1.5 text-muted font-medium">
                      <Calendar size={13} className="text-accent shrink-0" />
                      <span>
                        {language === 'en' 
                          ? `Due: ${item.dueDay}${item.dueDay === 1 ? 'st' : item.dueDay === 2 ? 'nd' : item.dueDay === 3 ? 'rd' : 'th'} of month` 
                          : `পরিশোধের তারিখ: ${formatNum(item.dueDay)}`}
                      </span>
                    </div>

                    {/* Badges: Urgency and Status */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {urgency && (
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-bold",
                          urgency.badgeClass
                        )}>
                          <span>{language === 'bn' ? urgency.labelBn : urgency.labelEn}</span>
                        </span>
                      )}

                      <span className={cn(
                        "text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border",
                        isPaid
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      )}>
                        {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        <span>{isPaid 
                          ? (language === 'en' ? 'Paid' : 'পরিশোধিত') 
                          : (language === 'en' ? 'Not Paid' : 'অপরিশোধিত')}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Tier 3: Actions Bar */}
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap border-t border-glass-border/30">
                    {/* Paid / Unpaid Action Button */}
                    <button
                      type="button"
                      onClick={() => handleSetPaidStatus(item, targetYear, targetMonth, !isPaid)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                        isPaid
                          ? "bg-glass border border-glass-border hover:border-rose-500/40 text-muted hover:text-rose-400"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                      )}
                    >
                      {isPaid ? (
                        <>
                          <RotateCcw size={13} />
                          <span>{language === 'en' ? 'Mark as Unpaid' : 'অপরিশোধিত করুন'}</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} className="stroke-[3]" />
                          <span>{language === 'en' ? 'Mark as Paid' : 'পরিশোধিত করুন'}</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSingleApplyModalItem(item)}
                        disabled={!item.isActive}
                        className="px-2.5 py-2 rounded-xl bg-glass border border-glass-border hover:border-accent/40 text-muted hover:text-primary text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        title={language === 'en' ? 'Apply to other months' : 'অন্যান্য মাসে যুক্ত করুন'}
                      >
                        <CalendarDays size={13} className="text-accent" />
                        <span className="hidden sm:inline">{language === 'en' ? 'Other Months...' : 'অন্য মাস...'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="p-2 text-muted hover:text-accent rounded-xl hover:bg-glass border border-transparent hover:border-glass-border transition-colors cursor-pointer"
                        title={language === 'en' ? 'Edit' : 'সম্পাদনা'}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-muted hover:text-rose-400 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                        title={language === 'en' ? 'Delete' : 'মুছে ফেলুন'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Apply Single Item to Other Months */}
      {singleApplyModalItem && (
        <ApplySingleItemToMonthsModal
          item={singleApplyModalItem}
          onClose={() => setSingleApplyModalItem(null)}
          onApply={onApplyFixedCosts}
          onSetPaidMonths={(keys) => handleUpdateItemPaidMonths(singleApplyModalItem.id, keys, true)}
          transactions={transactions}
          currentCalendarYear={currentCalendarYear}
          currentCalendarMonth={currentCalendarMonth}
          currency={currency}
          language={language}
          onSuccess={(msg) => {
            setApplySuccessMessage(msg);
            setTimeout(() => setApplySuccessMessage(null), 4000);
          }}
        />
      )}

      {/* MODAL 2: Bulk Apply Active Fixed Costs to Any Month */}
      {isBulkApplyModalOpen && (
        <BulkApplyToMonthsModal
          fixedCosts={fixedCosts.filter(i => i.isActive)}
          onClose={() => setIsBulkApplyModalOpen(false)}
          onApply={onApplyFixedCosts}
          onSetItemsPaid={(ids, monthKey) => handleUpdateMultipleItemsPaid(ids, monthKey, true)}
          transactions={transactions}
          currentCalendarYear={currentCalendarYear}
          currentCalendarMonth={currentCalendarMonth}
          currency={currency}
          language={language}
          onSuccess={(msg) => {
            setApplySuccessMessage(msg);
            setTimeout(() => setApplySuccessMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
}

// Sub-component: Modal for applying an individual fixed cost to other months
function ApplySingleItemToMonthsModal({
  item,
  onClose,
  onApply,
  onSetPaidMonths,
  transactions,
  currentCalendarYear,
  currentCalendarMonth,
  currency,
  language,
  onSuccess
}: {
  item: FixedCostItem;
  onClose: () => void;
  onApply: (items: { amount: number; category: string; date: string; description: string; type: 'expense' }[]) => void;
  onSetPaidMonths?: (monthKeys: string[]) => void;
  transactions: { date: string; description: string; type: string }[];
  currentCalendarYear: number;
  currentCalendarMonth: number;
  currency: string;
  language: LanguageType;
  onSuccess: (msg: string) => void;
}) {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [customDueDay, setCustomDueDay] = useState<string>(item.dueDay ? item.dueDay.toString() : '1');

  // Check if item is marked paid in y-m
  const checkIsPaid = (y: number, m: number) => {
    const key = `${y}-${m}`;
    return !!(item.paidMonths && item.paidMonths[key]);
  };

  // Generate options for the next 12 months starting from current month
  const monthOptions = useMemo(() => {
    const list: { key: string; year: number; month: number; label: string; isPaid: boolean }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentCalendarYear, currentCalendarMonth + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${m}`;
      const mName = language === 'bn' ? MONTH_NAMES_BN[m] : MONTH_NAMES_EN[m];
      const yStr = language === 'bn' 
        ? String(y).split('').map(digit => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(digit)] || digit).join('')
        : String(y);
      list.push({
        key,
        year: y,
        month: m,
        label: `${mName} ${yStr}`,
        isPaid: checkIsPaid(y, m)
      });
    }
    return list;
  }, [currentCalendarYear, currentCalendarMonth, item.paidMonths, language]);

  const toggleMonth = (key: string) => {
    setSelectedMonths(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleApplySelected = () => {
    if (selectedMonths.length === 0) return;

    const itemsToAdd = selectedMonths.map(key => {
      const [yStr, mStr] = key.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const parsedCustomDue = parseInt(customDueDay, 10);
      const cleanCustomDue = isNaN(parsedCustomDue) ? item.dueDay : Math.min(31, Math.max(1, parsedCustomDue));
      const day = Math.min(cleanCustomDue, daysInMonth);
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      return {
        amount: item.amount,
        category: item.category,
        date: dateStr,
        description: item.title,
        type: 'expense' as const
      };
    });

    onApply(itemsToAdd);
    onSetPaidMonths?.(selectedMonths);
    onSuccess(
      language === 'en'
        ? `Applied "${item.title}" to ${itemsToAdd.length} month(s)!`
        : `"${item.title}" খরচটি ${itemsToAdd.length}টি মাসের হিসাবে যোগ করা হয়েছে!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
      <div className="bg-[var(--bg-deep)] border border-glass-border/80 w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-glass-border">
          <div>
            <h4 className="text-base font-bold text-primary flex items-center gap-2">
              <CalendarDays size={18} className="text-accent" />
              {language === 'en' ? 'Apply to Months' : 'মাস নির্বাচন করে খরচ যোগ করুন'}
            </h4>
            <p className="text-xs text-muted mt-0.5">
              <span className="font-semibold text-primary">{item.title}</span> ({currency}{item.amount.toLocaleString()})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-primary hover:bg-glass transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Due Day setting */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-glass border border-glass-border">
          <label className="text-xs font-bold text-muted">
            {language === 'en' ? 'Due Day for Selected Months:' : 'পরিশোধের তারিখ:'}
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="1"
              max="31"
              value={customDueDay}
              onChange={(e) => setCustomDueDay(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (customDueDay === '') {
                  setCustomDueDay('1');
                } else {
                  const val = parseInt(customDueDay, 10);
                  if (isNaN(val) || val < 1) {
                    setCustomDueDay('1');
                  } else if (val > 31) {
                    setCustomDueDay('31');
                  } else {
                    setCustomDueDay(val.toString());
                  }
                }
              }}
              placeholder="1-31"
              className="w-16 bg-bg-deep border border-glass-border rounded-lg px-2.5 py-1 text-xs font-bold text-primary text-center focus:outline-none focus:border-accent/60"
            />
            <span className="text-xs text-muted font-medium">
              {language === 'en' ? 'of month' : 'তারিখ'}
            </span>
          </div>
        </div>

        {/* Month Selection Grid */}
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          <label className="text-xs font-bold text-muted block mb-1">
            {language === 'en' ? 'Select Month(s) to Apply:' : 'যে যে মাসে যোগ করতে চান নির্বাচন করুন:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {monthOptions.map((opt) => {
              const isSelected = selectedMonths.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleMonth(opt.key)}
                  className={cn(
                    "p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer",
                    isSelected
                      ? "bg-accent/15 border-accent text-primary font-bold shadow-xs"
                      : "bg-glass border-glass-border text-muted hover:text-primary hover:border-glass-border/80"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold truncate">{opt.label}</div>
                    {opt.isPaid ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={11} />
                        {language === 'en' ? 'Paid' : 'পরিশোধিত'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                        <XCircle size={11} />
                        {language === 'en' ? 'Not Paid' : 'অপরিশোধিত'}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckSquare size={16} className="text-accent" />
                    ) : (
                      <Square size={16} className="text-faint" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-glass-border">
          <button
            type="button"
            onClick={() => {
              // Quick select unpaid months in the list
              const unpaidList = monthOptions.filter(o => !o.isPaid).map(o => o.key);
              setSelectedMonths(unpaidList);
            }}
            className="text-xs text-accent font-semibold hover:underline cursor-pointer"
          >
            {language === 'en' ? 'Select all unpaid' : 'সকল অপরিশোধিত নির্বাচন করুন'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-glass-border text-xs font-bold text-muted hover:text-primary transition-all cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'বাতিল'}
            </button>
            <button
              type="button"
              onClick={handleApplySelected}
              disabled={selectedMonths.length === 0}
              className="px-5 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 text-xs font-bold shadow-md shadow-accent/20 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              {language === 'en' 
                ? `Apply (${selectedMonths.length})` 
                : `যুক্ত করুন (${selectedMonths.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component: Bulk apply all active fixed costs to a specific month
function BulkApplyToMonthsModal({
  fixedCosts,
  onClose,
  onApply,
  onSetItemsPaid,
  transactions,
  currentCalendarYear,
  currentCalendarMonth,
  currency,
  language,
  onSuccess
}: {
  fixedCosts: FixedCostItem[];
  onClose: () => void;
  onApply: (items: { amount: number; category: string; date: string; description: string; type: 'expense' }[]) => void;
  onSetItemsPaid?: (ids: string[], monthKey: string) => void;
  transactions: { date: string; description: string; type: string }[];
  currentCalendarYear: number;
  currentCalendarMonth: number;
  currency: string;
  language: LanguageType;
  onSuccess: (msg: string) => void;
}) {
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentCalendarMonth);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(fixedCosts.map(i => i.id));

  // Check if item is marked paid in selectedYear & selectedMonth
  const checkItemIsPaid = (item: FixedCostItem) => {
    const key = `${selectedYear}-${selectedMonth}`;
    return !!(item.paidMonths && item.paidMonths[key]);
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApply = () => {
    const itemsToProcess = fixedCosts.filter(i => selectedItemIds.includes(i.id));
    if (itemsToProcess.length === 0) return;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const itemsToAdd = itemsToProcess.map(item => {
      const day = Math.min(item.dueDay, daysInMonth);
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        amount: item.amount,
        category: item.category,
        date: dateStr,
        description: item.title,
        type: 'expense' as const
      };
    });

    const mName = language === 'bn' ? MONTH_NAMES_BN[selectedMonth] : MONTH_NAMES_EN[selectedMonth];
    onApply(itemsToAdd);
    onSetItemsPaid?.(itemsToProcess.map(i => i.id), `${selectedYear}-${selectedMonth}`);
    onSuccess(
      language === 'en'
        ? `Applied & marked ${itemsToAdd.length} fixed expense(s) as Paid for ${mName} ${selectedYear}!`
        : `${mName} ${selectedYear}-এর হিসাবে ${itemsToAdd.length}টি নির্দিষ্ট খরচ পরিশোধিত করা হয়েছে!`
    );
    onClose();
  };

  const availableYears = useMemo(() => {
    const list: number[] = [];
    for (let y = currentCalendarYear - 1; y <= currentCalendarYear + 4; y++) {
      list.push(y);
    }
    return list;
  }, [currentCalendarYear]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in">
      <div className="bg-[var(--bg-deep)] border border-glass-border/80 w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-glass-border">
          <div>
            <h4 className="text-base font-bold text-primary flex items-center gap-2">
              <Layers size={18} className="text-accent" />
              {language === 'en' ? 'Apply Fixed Costs to Month' : 'মাসিক নির্দিষ্ট খরচ যেকোনো মাসে যোগ করুন'}
            </h4>
            <p className="text-xs text-muted mt-0.5">
              {language === 'en' ? 'Select target month and choose which expenses to apply' : 'কাঙ্ক্ষিত মাস এবং খরচগুলো নির্বাচন করুন'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-primary hover:bg-glass transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Month Pickers */}
        <div className="p-3.5 rounded-2xl bg-glass border border-glass-border flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-bold text-muted flex items-center gap-1.5">
            <Calendar size={14} className="text-accent" />
            {language === 'en' ? 'Target Month & Year:' : 'কাঙ্ক্ষিত মাস ও বছর:'}
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-bg-deep border border-glass-border rounded-xl px-3 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent/60"
            >
              {(language === 'bn' ? MONTH_NAMES_BN : MONTH_NAMES_EN).map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-bg-deep border border-glass-border rounded-xl px-3 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent/60"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>
                  {language === 'bn' 
                    ? String(y).split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                    : y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Item Selection List */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-bold text-muted px-1">
            <span>{language === 'en' ? 'Expenses to Include:' : 'অন্তর্ভুক্ত খরচসমূহ:'}</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setSelectedItemIds(fixedCosts.map(i => i.id))}
                className="text-accent hover:underline cursor-pointer"
              >
                {language === 'en' ? 'All' : 'সব'}
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => {
                  const unpaids = fixedCosts.filter(i => !checkItemIsPaid(i)).map(i => i.id);
                  setSelectedItemIds(unpaids);
                }}
                className="text-accent hover:underline cursor-pointer"
              >
                {language === 'en' ? 'Unpaid only' : 'শুধুমাত্র অপরিশোধিত'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {fixedCosts.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isPaid = checkItemIsPaid(item);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer",
                    isSelected
                      ? "bg-accent/10 border-accent/40 text-primary"
                      : "bg-glass border-glass-border text-muted hover:text-primary"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isSelected ? (
                      <CheckSquare size={16} className="text-accent shrink-0" />
                    ) : (
                      <Square size={16} className="text-faint shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-muted font-normal">({item.category})</span>
                      </div>
                      <div className="text-[10px] text-muted">
                        {language === 'en' ? `Due day ${item.dueDay}` : `${item.dueDay} তারিখ`}
                        {isPaid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-2 inline-flex items-center gap-0.5">
                            • {language === 'en' ? 'Already Paid' : 'ইতিমধ্যে পরিশোধিত'}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-bold ml-2 inline-flex items-center gap-0.5">
                            • {language === 'en' ? 'Not Paid' : 'অপরিশোধিত'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-extrabold text-primary shrink-0 tabular-nums">
                    {currency}{item.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-glass-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-glass-border text-xs font-bold text-muted hover:text-primary transition-all cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'বাতিল'}
          </button>
          <button
            type="button"
            onClick={handleBulkApply}
            disabled={selectedItemIds.length === 0}
            className="px-5 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 text-xs font-bold shadow-md shadow-accent/20 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            {language === 'en' 
              ? `Apply (${selectedItemIds.length}) to Selected Month` 
              : `নির্বাচিত মাসে যোগ করুন (${selectedItemIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
