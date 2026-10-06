/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  LayoutDashboard, 
  LogOut, 
  ChevronRight,
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Heart,
  Briefcase,
  DollarSign,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  BarChart3,
  Target,
  User,
  Settings,
  ShieldCheck,
  Calendar,
  Download,
  RefreshCcw,
  Link as LinkIcon,
  Info,
  X,
  Edit2,
  Rocket,
  Sun,
  Moon,
  CheckCircle2,
  Camera,
  Upload,
  Bell,
  Search,
  Filter,
  Check,
  ChevronLeft,
  BellDot,
  Trash,
  Scale,
  Globe,
  Repeat,
  Calculator,
  Coins,
  MapPin,
  Maximize2,
  Minimize2,
  Share2,
  FileText,
  Wrench,
  Sparkles
} from 'lucide-react';
import { CalendarPicker } from './components/CalendarPicker';
import { FixedCostManager } from './components/FixedCostManager';
import { YearlyTaxCalculator } from './components/YearlyTaxCalculator';
import { NearbyCurrencyExchange } from './components/NearbyCurrencyExchange';
import { AuthAnimatedBackground } from './components/AuthAnimatedBackground';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Sector,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App as CapacitorApp } from '@capacitor/app';
import { BENGALI_FONT_BASE64 } from './bengaliFontBase64';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

import { translations, LanguageType } from './translations';

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  customCategory?: string | null;
  date: string;
  description: string;
  type: TransactionType;
  linkedIncomeIds?: string[] | null;
}

interface AppNotification {
  id: string;
  title: string;
  titleBn?: string;
  message: string;
  messageBn?: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
}

interface Category {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const getLocalizedDescription = (desc: string, lang: LanguageType): string => {
  if (lang !== 'bn') return desc;
  const map: Record<string, string> = {
    'Bazar': 'বাজার',
    'Rickshaw/CNG': 'রিকশা / সিএনজি',
    'Mobile Recharge': 'মোবাইল রিচার্জ',
    'Rent': 'ভাড়া',
    'Utilities': 'ইউটিলিটি বিল',
    'Tuition': 'টিউশনি',
    'Hostel': 'হোস্টেল',
    'Food': 'খাবার',
    'Shopping': 'কেনাকাটা',
    'Health': 'স্বাস্থ্য',
    'Entertainment': 'বিনোদন',
    'Salary': 'বেতন',
    'Other': 'অন্যান্য',
    'Investment': 'বিনিয়োগ',
    'Gift': 'উপহার',
    'Prior Month Savings': 'পূর্ববর্তী সঞ্চয়',
    'Income': 'আয়',
    'Expense': 'ব্যয়'
  };
  return map[desc] || desc;
};

const formatNumber = (
  num: number,
  lang: LanguageType,
  options?: Intl.NumberFormatOptions
): string => {
  try {
    return num.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', options);
  } catch (e) {
    return num.toString();
  }
};

const toBanglaNumerals = (val: number | string): string => {
  const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (match) => {
    const idx = enDigits.indexOf(match);
    return idx !== -1 ? bnDigits[idx] : match;
  });
};

const toEnglishNumerals = (val: string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return val.replace(/[০-৯]/g, (match) => {
    const idx = bnDigits.indexOf(match);
    return idx !== -1 ? enDigits[idx] : match;
  });
};

const getLocalizedName = (name: string, lang: LanguageType): string => {
  if (lang !== 'bn') return name;
  if (!name) return 'ব্যবহারকারী';
  
  const trimmed = name.trim();
  
  const translitWord = (word: string): string => {
    let w = word.toLowerCase();
    
    const exacts: Record<string, string> = {
      'user': 'ব্যবহারকারী',
      'ray': 'রায়',
      'rabby': 'রাব্বি',
      'rabbi': 'রাব্বি',
      'guest': 'অতিথি',
      'admin': 'অ্যাডমিন',
      'jibihhu': 'জিবিহহু',
      'siam': 'সিয়াম',
      'hasan': 'হাসান',
      'sajib': 'সজীব',
      'sakib': 'সাকিব',
      'shakib': 'সাকিব',
      'anik': 'অনিক',
      'tarek': 'তারেক',
      'rahat': 'রাহাত',
      'kamal': 'কামাল',
      'jamal': 'জামাল',
      'nabil': 'নাবিল',
      'fahim': 'ফাহিম',
      'arif': 'আরিফ',
      'imran': 'ইমরান',
      'mamun': 'মামুন',
      'sujon': 'সুজন',
      'sumon': 'সুমন',
      'rony': 'রনি',
      'mitu': 'মিতু',
      'joy': 'জয়',
      'apu': 'অপু',
      'islam': 'ইসলাম',
      'rahman': 'রহমান',
      'rohman': 'রহমান',
      'sarker': 'সরকার',
      'sarkar': 'সরকার',
      'khan': 'খান',
      'chowdhury': 'চৌধুরী',
      'ahmed': 'আহমেদ',
      'akter': 'আক্তার',
      'begum': 'বেগম',
      'ali': 'আলী',
      'hossain': 'হোসেন',
      'husain': 'হোসেন',
      'hassan': 'হাসান',
      'rayhan': 'রায়হান',
      'yeasin': 'ইয়াসিন',
      'yasin': 'ইয়াসিন',
      'sadman': 'সাদমান',
      'tasnim': 'তাসনিম',
      'tasnuba': 'তাসনুবা',
      'faria': 'ফারিয়া',
      'promi': 'প্রমি',
      'mim': 'মিম',
      'nipa': 'নিপা',
      'pavel': 'পাভেল',
      'shuvo': 'শুভ',
      'niloy': 'নিলয়',
      'munna': 'মুন্না',
      'babu': 'বাবু',
      'rana': 'রানা',
      'rubel': 'রুবেল',
      'mizan': 'মিজান',
      'selim': 'সেলিম',
      'reza': 'রেজা',
      'kajol': 'কাজল',
      'shourav': 'সৌরভ',
      'sourav': 'সৌরভ',
      'sabbir': 'সাব্বির',
      'sohel': 'সোহেল',
      'sohag': 'সোহাগ',
      'bipul': 'বিপুল',
      'asif': 'আসিফ',
      'ashik': 'আশিক',
      'sharmila': 'শর্মিলা',
      'mousumi': 'মৌসুমী',
      'tisha': 'তিশা',
      'nodi': 'নদী',
      'meghna': 'মেঘনা',
      'shunno': 'শূন্য',
      'bappa': 'বাপ্পা',
      'tahsan': 'তাহসান',
      'minar': 'মিনার',
      'elita': 'এলিটা',
      'kona': 'কনা',
      'belal': 'বেলাল',
      'milon': 'মিলন',
      'james': 'জেমস',
      'parvez': 'পারভেজ',
      'sohan': 'সোহান',
      'tanvir': 'তানভীর',
      'rifat': 'রিফাত',
      'rayan': 'রায়ান',
      'sheikh': 'শেখ',
      'gazi': 'গাজী',
      'bhuiyan': 'ভূঁইয়া',
      'bhowmik': 'ভৌমিক',
      'das': 'দাস',
      'roy': 'রায়',
      'sen': 'সেন',
      'dutta': 'দত্ত',
      'paul': 'পাল',
      'saha': 'সাহা',
      'ghosh': 'ঘোষ',
      'pal': 'পাল',
    };
    
    if (exacts[w]) return exacts[w];
    
    const consonants: Record<string, string> = {
      'sh': 'শ', 'ch': 'চ', 'kh': 'খ', 'gh': 'ঘ', 'th': 'থ', 'dh': 'ধ', 'ph': 'ফ', 'bh': 'ভ',
      'bb': 'ব্ব', 'dd': 'ড্ড', 'tt': 'ট্ট', 'pp': 'প্প', 'll': 'ল্ল', 'mm': 'ম্ম', 'nn': 'ন্ন', 'cc': 'ক্ক', 'kk': 'ক্ক',
      'b': 'ব', 'c': 'ক', 'd': 'দ', 'f': 'ফ', 'g': 'গ', 'h': 'হ', 'j': 'জ', 'k': 'ক', 'l': 'ল', 'm': 'ম', 'n': 'ন',
      'p': 'প', 'q': 'ক', 'r': 'র', 's': 'স', 't': 'ত', 'v': 'ভ', 'w': 'ওয়', 'x': 'ক্স', 'y': 'য়', 'z': 'জ'
    };
    
    const vowels: Record<string, string> = {
      'ia': 'িয়া', 'ae': 'ে', 'ee': 'ী', 'oo': 'ু', 'oi': 'ৈ', 'ou': 'ু', 'au': 'ৌ', 'ay': 'ায়', 'oy': 'য়',
      'a': 'া', 'e': 'ে', 'i': 'ি', 'o': 'ো', 'u': 'ু', 'y': 'ি'
    };
    
    const indVowels: Record<string, string> = {
      'ia': 'িয়া', 'ae': 'এ', 'ee': 'ঈ', 'oo': 'উ', 'oi': 'ঐ', 'ou': 'উ', 'ay': 'আয়', 'oy': 'অয়',
      'a': 'আ', 'e': 'এ', 'i': 'ই', 'o': 'ও', 'u': 'উ', 'y': 'ই'
    };

    let result = '';
    let i = 0;
    while (i < w.length) {
      if (i < w.length - 1) {
        const cluster2 = w.slice(i, i + 2);
        if (consonants[cluster2]) {
          result += consonants[cluster2];
          i += 2;
          continue;
        }
      }
      
      if (i < w.length - 1) {
        const cluster2 = w.slice(i, i + 2);
        if (vowels[cluster2]) {
          const isStart = i === 0;
          result += isStart ? (indVowels[cluster2] || vowels[cluster2]) : vowels[cluster2];
          i += 2;
          continue;
        }
      }
      
      const char = w[i];
      if (vowels[char]) {
        const isStart = i === 0 || (i > 0 && vowels[w[i-1]]);
        if (isStart) {
          result += indVowels[char] || vowels[char];
        } else {
          result += vowels[char];
        }
        i++;
        continue;
      }
      
      if (consonants[char]) {
        result += consonants[char];
        i++;
        continue;
      }
      
      result += char;
      i++;
    }
    
    return result;
  };

  const words = trimmed.split(/(\s+)/);
  const localizedWords = words.map(word => {
    if (/^\s+$/.test(word)) return word;
    if (!/^[a-zA-Z]+$/.test(word)) return word;
    return translitWord(word);
  });

  return localizedWords.join('');
};

// --- Constants ---

const CATEGORIES: Record<string, Category> = {
  Bazar: { name: 'Bazar', icon: <ShoppingBag size={18} />, color: '#ff7f50' },
  'Rickshaw/CNG': { name: 'Rickshaw/CNG', icon: <Car size={18} />, color: '#ff8c69' },
  'Mobile Recharge': { name: 'Mobile Recharge', icon: <Zap size={18} />, color: '#ff9977' },
  Rent: { name: 'Rent', icon: <Home size={18} />, color: '#ff7f50' },
  Utilities: { name: 'Utilities', icon: <Zap size={18} />, color: '#ff8c69' },
  Tuition: { name: 'Tuition', icon: <Briefcase size={18} />, color: '#ff9977' },
  Hostel: { name: 'Hostel', icon: <Home size={18} />, color: '#ff7f50' },
  Food: { name: 'Food', icon: <Utensils size={18} />, color: '#ff8c69' },
  Shopping: { name: 'Shopping', icon: <ShoppingBag size={18} />, color: '#ff7f50' },
  Health: { name: 'Health', icon: <Heart size={18} />, color: '#ff9977' },
  Entertainment: { name: 'Entertainment', icon: <PieChartIcon size={18} />, color: '#ff8c69' },
  Salary: { name: 'Salary', icon: <Briefcase size={18} />, color: '#ff7f50' },
  Other: { name: 'Other', icon: <DollarSign size={18} />, color: '#aeb5b5' },
};

const INCOME_CATEGORIES = ['Salary', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = Object.keys(CATEGORIES).filter(c => c !== 'Salary');

const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date(dateStr);
};

// --- Components ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState('');
  const [userGender, setUserGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const day = new Date().getDate();
    return day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : day <= 28 ? 4 : 5;
  });
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currency, setCurrency] = useState('৳');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const [language, setLanguage] = useState<LanguageType>(() => {
    return (localStorage.getItem('language') as LanguageType) || 'en';
  });

  const t = translations[language];

  const getTranslatedCategory = (catName: string) => {
    const catMap: Record<string, keyof typeof t> = {
      'Bazar': 'catBazar',
      'Rickshaw/CNG': 'catRickshawCNG',
      'Mobile Recharge': 'catMobileRecharge',
      'Rent': 'catRent',
      'Utilities': 'catUtilities',
      'Tuition': 'catTuition',
      'Hostel': 'catHostel',
      'Food': 'catFood',
      'Shopping': 'catShopping',
      'Health': 'catHealth',
      'Entertainment': 'catEntertainment',
      'Salary': 'catSalary',
      'Other': 'catOther',
      'Investment': 'catInvestment',
      'Gift': 'catGift'
    };
    const key = catMap[catName];
    if (key && t[key]) {
      return t[key] as string;
    }
    return catName;
  };
  const [trendPeriod, setTrendPeriod] = useState<'7days' | 'monthComparison'>('7days');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('finflow_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load notifications from localStorage", e);
    }
    return [];
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'alert';
  } | null>(null);

  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  const loadDismissedAlerts = (): Set<string> => {
    try {
      const saved = localStorage.getItem('finflow_dismissed_alerts');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load dismissed alerts", e);
    }
    return new Set();
  };

  const dismissedAlertsRef = useRef<Set<string>>(loadDismissedAlerts());

  const saveDismissedAlerts = (set: Set<string>) => {
    try {
      localStorage.setItem('finflow_dismissed_alerts', JSON.stringify(Array.from(set)));
      if (auth.currentUser) {
        localStorage.setItem(`finflow_dismissed_alerts_${auth.currentUser.uid}`, JSON.stringify(Array.from(set)));
      }
    } catch (e) {
      console.error("Failed to save dismissed alerts", e);
    }
  };

  const loadReadAlerts = (): Set<string> => {
    try {
      const saved = localStorage.getItem('finflow_read_alerts');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load read alerts", e);
    }
    return new Set();
  };

  const readAlertsRef = useRef<Set<string>>(loadReadAlerts());

  const saveReadAlerts = (set: Set<string>) => {
    try {
      localStorage.setItem('finflow_read_alerts', JSON.stringify(Array.from(set)));
      if (auth.currentUser) {
        localStorage.setItem(`finflow_read_alerts_${auth.currentUser.uid}`, JSON.stringify(Array.from(set)));
      }
    } catch (e) {
      console.error("Failed to save read alerts", e);
    }
  };

  const pushNotification = (notif: {
    id?: string;
    title: string;
    titleBn?: string;
    message: string;
    messageBn?: string;
    type: 'info' | 'warning' | 'success' | 'alert';
  }) => {
    const id = notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNotification: AppNotification = {
      ...notif,
      id,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      return [newNotification, ...filtered];
    });
    setToastNotification({
      id,
      title: language === 'bn' && newNotification.titleBn ? newNotification.titleBn : newNotification.title,
      message: language === 'bn' && newNotification.messageBn ? newNotification.messageBn : newNotification.message,
      type: newNotification.type
    });
  };

  const handleMarkRead = (id: string) => {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth();
    readAlertsRef.current.add(id);
    readAlertsRef.current.add(`${id}-${curYear}-${curMonth}`);
    saveReadAlerts(readAlertsRef.current);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth();
    notifications.forEach(n => {
      readAlertsRef.current.add(n.id);
      readAlertsRef.current.add(`${n.id}-${curYear}-${curMonth}`);
    });
    saveReadAlerts(readAlertsRef.current);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth();
    dismissedAlertsRef.current.add(id);
    dismissedAlertsRef.current.add(`${id}-${curYear}-${curMonth}`);
    saveDismissedAlerts(dismissedAlertsRef.current);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth();
    notifications.forEach(n => {
      dismissedAlertsRef.current.add(n.id);
      dismissedAlertsRef.current.add(`${n.id}-${curYear}-${curMonth}`);
    });
    saveDismissedAlerts(dismissedAlertsRef.current);
    setNotifications([]);
  };

  useEffect(() => {
    try {
      if (auth.currentUser) {
        localStorage.setItem(`finflow_notifications_${auth.currentUser.uid}`, JSON.stringify(notifications));
      }
      localStorage.setItem('finflow_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error("Failed to save notifications to localStorage", e);
    }
  }, [notifications]);

  const completeOnboarding = async () => {
    setShowOnboarding(false);
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        hasCompletedOnboarding: true
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionsLoaded, setIsTransactionsLoaded] = useState(false);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const isInitialDataLoadedRef = useRef(false);
  const [budget, setBudget] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'history' | 'analytics' | 'budget' | 'user' | 'settings' | 'tools'>('overview');
  const [activeTool, setActiveTool] = useState<'nearby_exchange' | 'fixed_costs' | 'tax_calculator' | 'currency' | 'tour' | 'export' | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalType, setProfileModalType] = useState<'name' | 'password'>('name');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [androidPdfModal, setAndroidPdfModal] = useState<{
    isOpen: boolean;
    blob: Blob | null;
    filename: string;
    file: File | null;
    base64DataUri?: string;
    fileUri?: string;
    pureBase64?: string;
  } | null>(null);

  const isAndroidDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isCapacitor = typeof Capacitor !== 'undefined' && (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android');
    return isCapacitor || /Android/i.test(ua) || Boolean((window as any).Android || (window as any).AndroidBridge || (window as any).JSBridge);
  };
  const [isNearbyExchangeFullscreen, setIsNearbyExchangeFullscreen] = useState(false);

  // Navigation History Stack for Android physical/system Back button
  type TabType = 'overview' | 'add' | 'history' | 'analytics' | 'budget' | 'user' | 'settings' | 'tools';
  type ToolType = 'nearby_exchange' | 'fixed_costs' | 'tax_calculator' | 'currency' | 'tour' | 'export' | null;

  interface NavHistoryItem {
    tab: TabType;
    tool: ToolType;
  }

  const navHistoryRef = useRef<NavHistoryItem[]>([]);
  const isBackNavigatingRef = useRef(false);
  const lastBackPressTimeRef = useRef(0);
  const lastBackActionTimeRef = useRef(0);
  const prevNavStateRef = useRef<NavHistoryItem>({ tab: activeTab, tool: activeTool });

  // Track forward navigation in user interactions
  useEffect(() => {
    const prev = prevNavStateRef.current;
    const current: NavHistoryItem = { tab: activeTab, tool: activeTool };

    if (isBackNavigatingRef.current) {
      isBackNavigatingRef.current = false;
      prevNavStateRef.current = current;
      return;
    }

    if (prev.tab !== current.tab || prev.tool !== current.tool) {
      const history = navHistoryRef.current;
      const last = history[history.length - 1];
      if (!last || last.tab !== prev.tab || last.tool !== prev.tool) {
        history.push({ tab: prev.tab, tool: prev.tool });
        if (history.length > 30) {
          history.shift();
        }
      }
      prevNavStateRef.current = current;
    }
  }, [activeTab, activeTool]);

  // Clean up history if user returned to tools list
  useEffect(() => {
    if (activeTab === 'tools' && activeTool === null) {
      while (
        navHistoryRef.current.length > 0 &&
        navHistoryRef.current[navHistoryRef.current.length - 1].tool !== null
      ) {
        navHistoryRef.current.pop();
      }
    }
  }, [activeTab, activeTool]);

  const handleAndroidBackButton = () => {
    const now = Date.now();
    // Debounce rapid duplicate trigger events (e.g. Capacitor App listener + document event)
    if (now - lastBackActionTimeRef.current < 250) {
      return;
    }
    lastBackActionTimeRef.current = now;

    // 1. Dispatch custom event so any child components/modals can intercept and handle their own close
    const customBackEvent = new CustomEvent('app-back-button', { cancelable: true });
    const wasHandledByChild = !window.dispatchEvent(customBackEvent);
    if (wasHandledByChild) {
      return;
    }

    // 2. Close any top-level modals / fullscreen overlays
    if (androidPdfModal?.isOpen) {
      setAndroidPdfModal(null);
      return;
    }
    if (editingTransaction) {
      setEditingTransaction(null);
      return;
    }
    if (isProfileModalOpen) {
      setIsProfileModalOpen(false);
      return;
    }
    if (isConfirmModalOpen) {
      setIsConfirmModalOpen(false);
      return;
    }
    if (isNearbyExchangeFullscreen) {
      setIsNearbyExchangeFullscreen(false);
      return;
    }

    // 3. If currently in a dedicated feature page inside Tools, navigate back to Tools list
    // (exact same behavior as the app's own Back button)
    if (activeTool !== null) {
      isBackNavigatingRef.current = true;
      while (
        navHistoryRef.current.length > 0 &&
        navHistoryRef.current[navHistoryRef.current.length - 1].tab === 'tools'
      ) {
        navHistoryRef.current.pop();
      }
      setActiveTool(null);
      return;
    }

    // 4. If logged out and on LoginView root
    if (!isLoggedIn) {
      if (now - lastBackPressTimeRef.current < 2000) {
        try {
          CapacitorApp.exitApp();
        } catch {
          // ignore
        }
      } else {
        lastBackPressTimeRef.current = now;
        pushNotification({
          id: 'login-exit-' + now,
          title: language === 'bn' ? 'প্রস্থান করতে আবার চাপুন' : 'Press Back Again',
          message: language === 'bn' ? 'অ্যাপ থেকে বের হতে আবার ব্যাক বাটন চাপুন।' : 'Press back again to exit the app.',
          type: 'info'
        });
      }
      return;
    }

    // 5. Pop from navigation history if available
    while (navHistoryRef.current.length > 0) {
      const prev = navHistoryRef.current.pop();
      if (prev && (prev.tab !== activeTab || prev.tool !== activeTool)) {
        isBackNavigatingRef.current = true;
        setActiveTab(prev.tab);
        setActiveTool(prev.tool);
        return;
      }
    }

    // 6. If not on overview (Home) and history is empty, go to overview
    if (activeTab !== 'overview') {
      isBackNavigatingRef.current = true;
      setActiveTab('overview');
      setActiveTool(null);
      return;
    }

    // 7. User is on the Main/Home page ('overview') with no open feature page or modal:
    // Follow standard Android app behavior: double-press back to exit app
    if (now - lastBackPressTimeRef.current < 2000) {
      try {
        CapacitorApp.exitApp();
      } catch (e) {
        console.warn('CapacitorApp.exitApp:', e);
      }
    } else {
      lastBackPressTimeRef.current = now;
      pushNotification({
        id: 'back-exit-toast-' + now,
        title: language === 'bn' ? 'প্রস্থান করতে আবার চাপুন' : 'Press Back Again',
        message: language === 'bn' ? 'অ্যাপ থেকে বের হতে আবার ব্যাক বাটন চাপুন।' : 'Press back again to exit the app.',
        type: 'info'
      });
    }
  };

  // Register physical/system Android Back button listeners
  useEffect(() => {
    let removeCapacitorListener: (() => void) | null = null;
    try {
      const listenerPromise = CapacitorApp.addListener('backButton', () => {
        handleAndroidBackButton();
      });
      listenerPromise.then(handle => {
        removeCapacitorListener = () => handle.remove();
      }).catch(err => {
        console.warn('Capacitor backButton listener registration:', err);
      });
    } catch (e) {
      console.warn('CapacitorApp backButton listener setup error:', e);
    }

    const handleDocumentBack = (e: Event) => {
      e.preventDefault();
      handleAndroidBackButton();
    };
    document.addEventListener('backbutton', handleDocumentBack);

    const handlePopState = () => {
      handleAndroidBackButton();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      if (removeCapacitorListener) {
        removeCapacitorListener();
      }
      document.removeEventListener('backbutton', handleDocumentBack);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    activeTab,
    activeTool,
    androidPdfModal,
    editingTransaction,
    isProfileModalOpen,
    isConfirmModalOpen,
    isNearbyExchangeFullscreen,
    isLoggedIn,
    language
  ]);

  // Theme Persistence: Show loading screen in Light Mode on open/reload/refresh; apply user's selected UI theme after loading completes
  useEffect(() => {
    if (!isAuthReady) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isAuthReady]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          theme: newTheme
        });
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  };

  const changeLanguage = async (newLang: LanguageType) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          language: newLang
        });
      } catch (error) {
        console.error("Error updating language:", error);
      }
    }
  };

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email || undefined,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setFirestoreError(errInfo.error);
    // Auto-clear error after 5 seconds
    setTimeout(() => setFirestoreError(null), 5000);
  };

  // Sub-component for filters to use across tabs
  const FilterControls = () => (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex flex-wrap glass p-1 rounded-xl w-full sm:w-auto">
        {(['all', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTimeFilter(f)}
            className={cn(
              "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
              timeFilter === f ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:text-accent"
            )}
          >
            {translations[language][f]}
          </button>
        ))}
      </div>
      {(timeFilter === 'monthly' || timeFilter === 'yearly' || timeFilter === 'weekly' || timeFilter === 'custom') && (
        <div className="flex flex-wrap items-center gap-2">
          {(timeFilter === 'monthly' || timeFilter === 'weekly') && (
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flex-1 sm:flex-none bg-bg-deep border border-glass-border rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary focus:outline-none focus:border-accent/50"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const monthName = new Date(2026, i, 1).toLocaleString(language === 'bn' ? 'bn-BD' : 'default', { month: 'long' });
                return <option key={i} value={i}>{monthName}</option>;
              })}
            </select>
          )}
          {(timeFilter === 'monthly' || timeFilter === 'yearly' || timeFilter === 'weekly') && (
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="flex-1 sm:flex-none bg-bg-deep border border-glass-border rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary focus:outline-none focus:border-accent/50"
            >
              {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map(y => {
                const displayYear = language === 'bn' 
                  ? String(y).split('').map(digit => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(digit)] || digit).join('') 
                  : y;
                return <option key={y} value={y}>{displayYear}</option>;
              })}
            </select>
          )}
          {timeFilter === 'weekly' && (
            <select 
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="flex-1 sm:flex-none bg-bg-deep border border-glass-border rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary focus:outline-none focus:border-accent/50"
            >
              {[1, 2, 3, 4, 5].map(w => {
                const bnNumber = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][w] || String(w);
                return (
                  <option key={w} value={w}>
                    {language === 'bn' ? `সপ্তাহ ${bnNumber}` : `Week ${w}`}
                  </option>
                );
              })}
            </select>
          )}
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-bg-deep border border-glass-border rounded-lg px-2 py-1 text-[10px] font-bold text-primary focus:outline-none focus:border-accent/50"
                title={language === 'en' ? 'Start Date' : 'শুরুর তারিখ'}
              />
              <span className="text-[10px] text-muted">-</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-bg-deep border border-glass-border rounded-lg px-2 py-1 text-[10px] font-bold text-primary focus:outline-none focus:border-accent/50"
                title={language === 'en' ? 'End Date' : 'শেষের তারিখ'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setIsLoggedIn(true);
          setUserEmail(user.email || '');
          setUserDisplayName(user.displayName || user.email?.split('@')[0] || '');
          
          // Fetch user profile for budget and registration date
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setBudget(userData.budget || 0);
            setUserGender(userData.gender || '');
            setUserPhotoURL(userData.photoURL || '');
            if (userData.theme) {
              setTheme(userData.theme);
              localStorage.setItem('theme', userData.theme);
            }
            if (userData.language) {
              setLanguage(userData.language);
              localStorage.setItem('language', userData.language);
            }
            if (!userData.hasCompletedOnboarding) {
              setShowOnboarding(true);
            }
            if (userData.createdAt) {
              const date = userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt);
              setRegistrationDate(date.toISOString());
            }
          } else {
            // Create missing profile for legacy users
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0],
              createdAt: serverTimestamp(),
              budget: 0,
              gender: '',
              hasCompletedOnboarding: false,
              language: 'en'
            });
            setBudget(0);
            setUserGender('');
            setShowOnboarding(true);
            setRegistrationDate(new Date().toISOString());
          }
          setIsUserDataLoaded(true);
          try {
            const userRead = localStorage.getItem(`finflow_read_alerts_${user.uid}`);
            if (userRead) {
              const parsed = JSON.parse(userRead);
              if (Array.isArray(parsed)) parsed.forEach((k: string) => readAlertsRef.current.add(k));
            }
            const globalRead = localStorage.getItem('finflow_read_alerts');
            if (globalRead) {
              const parsed = JSON.parse(globalRead);
              if (Array.isArray(parsed)) parsed.forEach((k: string) => readAlertsRef.current.add(k));
            }

            const userNotifs = localStorage.getItem(`finflow_notifications_${user.uid}`) || localStorage.getItem('finflow_notifications');
            if (userNotifs) {
              const parsedNotifs = JSON.parse(userNotifs);
              if (Array.isArray(parsedNotifs)) {
                setNotifications(parsedNotifs.map((n: AppNotification) => ({
                  ...n,
                  read: n.read || readAlertsRef.current.has(n.id)
                })));
              }
            }
            const userDismissed = localStorage.getItem(`finflow_dismissed_alerts_${user.uid}`) || localStorage.getItem('finflow_dismissed_alerts');
            if (userDismissed) {
              const parsed = JSON.parse(userDismissed);
              if (Array.isArray(parsed)) parsed.forEach((k: string) => dismissedAlertsRef.current.add(k));
            }
          } catch (e) {
            console.error("Error loading user-scoped notifications:", e);
          }
        } else {
          setIsLoggedIn(false);
          setTransactions([]);
          setBudget(0);
          setNotifications([]);
          setIsTransactionsLoaded(false);
          setIsUserDataLoaded(false);
          isInitialDataLoadedRef.current = false;
        }
      } catch (error) {
        console.error("Auth Listener Error:", error);
        handleFirestoreError(error, OperationType.GET, 'users');
      } finally {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Connection Test
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const testConnection = async () => {
      try {
        await getDoc(doc(db, 'users', auth.currentUser!.uid));
        console.log("Firestore connection verified");
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'connection_test');
      }
    };
    testConnection();
  }, [isLoggedIn]);

  // Budget Alerts & Notifications
  useEffect(() => {
    // CRITICAL: Must wait until auth is verified, user profile/budget is loaded, AND transactions are loaded!
    if (!isAuthReady || !isLoggedIn || !auth.currentUser || !isTransactionsLoaded || !isUserDataLoaded) return;

    const isFirstRun = !isInitialDataLoadedRef.current;
    if (isFirstRun) {
      isInitialDataLoadedRef.current = true;
    }

    if (budget > 0) {
      const now = new Date();
      const curMonth = now.getMonth();
      const curYear = now.getFullYear();

      const currentMonthExpenses = transactions
        .filter(t => {
          if (t.type !== 'expense' || !t.date) return false;
          const parts = t.date.split('-');
          if (parts.length >= 2) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            return y === curYear && m === curMonth;
          }
          const d = new Date(t.date);
          return d.getMonth() === curMonth && d.getFullYear() === curYear;
        })
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

      const percentage = (currentMonthExpenses / budget) * 100;
      const formattedBudgetEn = `${currency}${formatNumber(budget, 'en')}`;
      const formattedBudgetBn = `${currency}${formatNumber(budget, 'bn')}`;
      const formattedExpensesEn = `${currency}${formatNumber(currentMonthExpenses, 'en')}`;
      const formattedExpensesBn = `${currency}${formatNumber(currentMonthExpenses, 'bn')}`;
      const monthKey = `${curYear}-${curMonth}`;

      setNotifications(prev => {
        let updated = [...prev];

        if (percentage >= 100) {
          const id = 'budget-exceeded';
          const dismissKey = `${id}-${monthKey}`;
          updated = updated.filter(n => n.id !== 'budget-80');

          const existingIndex = updated.findIndex(n => n.id === id);
          const isAlreadyRead = readAlertsRef.current.has(id) || 
                                readAlertsRef.current.has(dismissKey) || 
                                (existingIndex >= 0 && updated[existingIndex].read) ||
                                (existingIndex >= 0 && readAlertsRef.current.has(updated[existingIndex].id));

          if (isAlreadyRead) {
            readAlertsRef.current.add(id);
            readAlertsRef.current.add(dismissKey);
            saveReadAlerts(readAlertsRef.current);
          }

          if (existingIndex >= 0) {
            // Keep existing read status and timestamp, update dynamic numbers
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              title: 'Budget Exceeded!',
              titleBn: 'বাজেট অতিক্রম করেছে!',
              message: `You have spent ${percentage.toFixed(0)}% of your monthly budget (${formattedExpensesEn} of ${formattedBudgetEn}).`,
              messageBn: `আপনি মাসিক বাজেটের ${toBanglaNumerals(percentage.toFixed(0))}% ব্যয় করেছেন (${formattedExpensesBn} / ${formattedBudgetBn})।`,
              read: isAlreadyRead,
              type: 'warning'
            };
          } else if (!dismissedAlertsRef.current.has(dismissKey) && !dismissedAlertsRef.current.has(id)) {
            const newAlert: AppNotification = {
              id,
              title: 'Budget Exceeded!',
              titleBn: 'বাজেট অতিক্রম করেছে!',
              message: `You have spent ${percentage.toFixed(0)}% of your monthly budget (${formattedExpensesEn} of ${formattedBudgetEn}).`,
              messageBn: `আপনি মাসিক বাজেটের ${toBanglaNumerals(percentage.toFixed(0))}% ব্যয় করেছেন (${formattedExpensesBn} / ${formattedBudgetBn})।`,
              timestamp: Date.now(),
              read: isAlreadyRead,
              type: 'warning'
            };
            updated = [newAlert, ...updated];
            // CRITICAL: NEVER notify or show toast on page refresh / initial load or if already read!
            if (!isFirstRun && !isAlreadyRead) {
              setToastNotification({
                id,
                title: language === 'bn' ? 'বাজেট অতিক্রম করেছে!' : 'Budget Exceeded!',
                message: language === 'bn' 
                  ? `আপনি মাসিক বাজেটের ${toBanglaNumerals(percentage.toFixed(0))}% ব্যয় করেছেন (${formattedExpensesBn} / ${formattedBudgetBn})।` 
                  : `You have spent ${percentage.toFixed(0)}% of your monthly budget (${formattedExpensesEn} of ${formattedBudgetEn}).`,
                type: 'warning'
              });
            }
          }
        } else if (percentage >= 80) {
          const id = 'budget-80';
          const dismissKey = `${id}-${monthKey}`;
          updated = updated.filter(n => n.id !== 'budget-exceeded');

          const existingIndex = updated.findIndex(n => n.id === id);
          const isAlreadyRead = readAlertsRef.current.has(id) || 
                                readAlertsRef.current.has(dismissKey) || 
                                (existingIndex >= 0 && updated[existingIndex].read) ||
                                (existingIndex >= 0 && readAlertsRef.current.has(updated[existingIndex].id));

          if (isAlreadyRead) {
            readAlertsRef.current.add(id);
            readAlertsRef.current.add(dismissKey);
            saveReadAlerts(readAlertsRef.current);
          }

          if (existingIndex >= 0) {
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              title: 'Budget Alert (80%)',
              titleBn: 'বাজেট সতর্কতা (৮০%)',
              message: `You have used ${percentage.toFixed(0)}% of your monthly budget (${formattedExpensesEn} of ${formattedBudgetEn}).`,
              messageBn: `আপনি মাসিক বাজেটের ${toBanglaNumerals(percentage.toFixed(0))}% ব্যয় করেছেন (${formattedExpensesBn} / ${formattedBudgetBn})।`,
              read: isAlreadyRead,
              type: 'warning'
            };
          } else if (!dismissedAlertsRef.current.has(dismissKey) && !dismissedAlertsRef.current.has(id)) {
            const newAlert: AppNotification = {
              id,
              title: 'Budget Alert (80%)',
              titleBn: 'বাজেট সতর্কতা (৮০%)',
              message: `You have used ${percentage.toFixed(0)}% of your monthly budget (${formattedExpensesEn} of ${formattedBudgetEn}).`,
              messageBn: `আপনি মাসিক বাজেটের ${toBanglaNumerals(percentage.toFixed(0))}% ব্যয় করেছেন (${formattedExpensesBn} / ${formattedBudgetBn})।`,
              timestamp: Date.now(),
              read: isAlreadyRead,
              type: 'warning'
            };
            updated = [newAlert, ...updated];
            // CRITICAL: NEVER notify or show toast on page refresh / initial load or if already read!
            if (!isFirstRun && !isAlreadyRead) {
              setToastNotification({
                id,
                title: language === 'bn' ? 'বাজেট সতর্কতা (৮০%)' : 'Budget Alert (80%)',
                message: language === 'bn' 
                  ? `আপনি মাসিক বাজেটের ${toBanglaNumerals(percentage.toFixed(0))}% ব্যয় করেছেন (${formattedExpensesBn} / ${formattedBudgetBn})।` 
                  : `You have used ${percentage.toFixed(0)}% of your monthly budget (${formattedExpensesEn} of ${formattedBudgetEn}).`,
                type: 'warning'
              });
            }
          }
        } else {
          // Spending dropped below 80%: remove active alert from list
          updated = updated.filter(n => n.id !== 'budget-exceeded' && n.id !== 'budget-80');
        }

        return updated;
      });
    } else {
      // User explicitly set budget to 0
      setNotifications(prev => prev.filter(n => n.id !== 'budget-exceeded' && n.id !== 'budget-80'));
    }
  }, [transactions, budget, currency, isAuthReady, isLoggedIn, isTransactionsLoaded, isUserDataLoaded, language]);

  // Check and push notifications for monthly fixed costs due soon (1 day, 1 week, today, or overdue)
  useEffect(() => {
    if (!isAuthReady) return;

    const checkFixedCostNotifications = () => {
      try {
        const saved = localStorage.getItem('finflow_fixed_costs');
        if (!saved) return;
        const fixedCosts = JSON.parse(saved);
        if (!Array.isArray(fixedCosts)) return;

        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth();
        const curDay = now.getDate();
        const curMonthKey = `${curYear}-${curMonth}`;
        const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
        const todayMidnight = new Date(curYear, curMonth, curDay);

        const nextMonthDate = new Date(curYear, curMonth + 1, 1);
        const nextYear = nextMonthDate.getFullYear();
        const nextMonth = nextMonthDate.getMonth();
        const nextMonthKey = `${nextYear}-${nextMonth}`;
        const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();

        let newlyTriggeredAlert: AppNotification | null = null;

        setNotifications(prev => {
          let updated = [...prev];

          fixedCosts.forEach((item: any) => {
            if (!item || !item.id || item.isActive === false) return;

            const isCurMonthPaid = !!(item.paidMonths && item.paidMonths[curMonthKey]);
            const isNextMonthPaid = !!(item.paidMonths && item.paidMonths[nextMonthKey]);
            const basePrefix = `fc-due-${item.id}`;

            let targetAlertId = '';
            let titleEn = '';
            let titleBn = '';
            let msgEn = '';
            let msgBn = '';
            let alertType: 'warning' | 'alert' | 'info' = 'info';

            const formattedAmtEn = `${currency}${formatNumber(item.amount, 'en')}`;
            const formattedAmtBn = `${currency}${formatNumber(item.amount, 'bn')}`;

            // Case A: Current month is NOT paid
            if (!isCurMonthPaid) {
              const curDueDay = Math.min(item.dueDay || 1, daysInCurMonth);
              const curDueDate = new Date(curYear, curMonth, curDueDay);
              const diffMs = curDueDate.getTime() - todayMidnight.getTime();
              const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

              if (diffDays === 0) {
                targetAlertId = `${basePrefix}-${curMonthKey}-today`;
                titleEn = 'Fixed Cost Due Today!';
                titleBn = 'নির্দিষ্ট খরচ আজ পরিশোধের দিন!';
                msgEn = `"${item.title}" (${formattedAmtEn}) is due today (${curDueDay}th). Please mark as paid once cleared.`;
                msgBn = `"${item.title}" (${formattedAmtBn}) আজ পরিশোধের দিন (${toBanglaNumerals(curDueDay)} তারিখ)। পরিশোধ শেষে পেইড হিসেবে চিহ্নিত করুন।`;
                alertType = 'alert';
              } else if (diffDays === 1) {
                targetAlertId = `${basePrefix}-${curMonthKey}-1d`;
                titleEn = 'Fixed Cost Due Tomorrow (1 Day Remaining)';
                titleBn = 'নির্দিষ্ট খরচ আগামীকাল পরিশোধের তারিখ (১ দিন বাকি)';
                msgEn = `"${item.title}" (${formattedAmtEn}) is due tomorrow on the ${curDueDay}th. Don't forget to pay!`;
                msgBn = `"${item.title}" (${formattedAmtBn}) আগামীকাল পরিশোধের তারিখ (${toBanglaNumerals(curDueDay)} তারিখ)। ১ দিন বাকি আছে, মনে করে পরিশোধ করুন!`;
                alertType = 'warning';
              } else if (diffDays > 1 && diffDays <= 7) {
                targetAlertId = `${basePrefix}-${curMonthKey}-week`;
                titleEn = `Upcoming Fixed Cost: ${diffDays} Days Remaining`;
                titleBn = `আসন্ন নির্দিষ্ট খরচ: ${toBanglaNumerals(diffDays)} দিন বাকি (~১ সপ্তাহ)`;
                msgEn = `"${item.title}" (${formattedAmtEn}) is due in ${diffDays} days on the ${curDueDay}th of this month (~1 week remaining).`;
                msgBn = `"${item.title}" (${formattedAmtBn}) পরিশোধের আর ${toBanglaNumerals(diffDays)} দিন বাকি (${toBanglaNumerals(curDueDay)} তারিখ)।`;
                alertType = 'warning';
              } else if (diffDays < 0) {
                targetAlertId = `${basePrefix}-${curMonthKey}-overdue`;
                titleEn = 'Overdue Fixed Cost!';
                titleBn = 'নির্দিষ্ট খরচ পরিশোধের তারিখ অতিক্রান্ত!';
                msgEn = `"${item.title}" (${formattedAmtEn}) was due on the ${curDueDay}th (${Math.abs(diffDays)} days ago). Please pay as soon as possible.`;
                msgBn = `"${item.title}" (${formattedAmtBn}) পরিশোধের তারিখ ${toBanglaNumerals(Math.abs(diffDays))} দিন আগে পার হয়েছে (${toBanglaNumerals(curDueDay)} তারিখ)।`;
                alertType = 'alert';
              }
            } else {
              // Current month is already paid! Check if next month's due date is approaching (within 7 days / 1 day)
              if (!isNextMonthPaid) {
                const nextDueDay = Math.min(item.dueDay || 1, daysInNextMonth);
                const nextDueDate = new Date(nextYear, nextMonth, nextDueDay);
                const diffMsNext = nextDueDate.getTime() - todayMidnight.getTime();
                const diffDaysNext = Math.round(diffMsNext / (1000 * 60 * 60 * 24));

                if (diffDaysNext === 1) {
                  targetAlertId = `${basePrefix}-${nextMonthKey}-1d`;
                  titleEn = 'Fixed Cost Due Tomorrow (1 Day Remaining)';
                  titleBn = 'পরের মাসের নির্দিষ্ট খরচ আগামীকাল (১ দিন বাকি)';
                  msgEn = `"${item.title}" (${formattedAmtEn}) is due tomorrow on the ${nextDueDay}th of next month.`;
                  msgBn = `"${item.title}" (${formattedAmtBn}) পরের মাসের ${toBanglaNumerals(nextDueDay)} তারিখ (আগামীকাল) পরিশোধের দিন।`;
                  alertType = 'warning';
                } else if (diffDaysNext > 1 && diffDaysNext <= 7) {
                  targetAlertId = `${basePrefix}-${nextMonthKey}-week`;
                  titleEn = `Upcoming Fixed Cost: ${diffDaysNext} Days Remaining`;
                  titleBn = `আসন্ন নির্দিষ্ট খরচ: ${toBanglaNumerals(diffDaysNext)} দিন বাকি (~১ সপ্তাহ)`;
                  msgEn = `"${item.title}" (${formattedAmtEn}) is due in ${diffDaysNext} days on the ${nextDueDay}th of next month (~1 week remaining).`;
                  msgBn = `"${item.title}" (${formattedAmtBn}) পরের মাসের ${toBanglaNumerals(nextDueDay)} তারিখে পরিশোধ করতে হবে, আর ${toBanglaNumerals(diffDaysNext)} দিন বাকি।`;
                  alertType = 'warning';
                }
              }
            }

            // Remove any obsolete alerts for this item that don't match the current active targetAlertId
            updated = updated.filter(n => {
              if (n.id.startsWith(basePrefix)) {
                return targetAlertId ? n.id === targetAlertId : false;
              }
              return true;
            });

            if (!targetAlertId) return;

            const existingIdx = updated.findIndex(n => n.id === targetAlertId);
            const isAlreadyRead = readAlertsRef.current.has(targetAlertId);

            if (existingIdx >= 0) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                title: titleEn,
                titleBn: titleBn,
                message: msgEn,
                messageBn: msgBn,
                type: alertType,
                read: isAlreadyRead
              };
            } else if (!dismissedAlertsRef.current.has(targetAlertId)) {
              const newAlert: AppNotification = {
                id: targetAlertId,
                title: titleEn,
                titleBn: titleBn,
                message: msgEn,
                messageBn: msgBn,
                type: alertType,
                timestamp: Date.now(),
                read: isAlreadyRead
              };
              updated = [newAlert, ...updated];
              if (!isAlreadyRead) {
                newlyTriggeredAlert = newAlert;
              }
            }
          });

          return updated;
        });

        // Trigger toast banner if a new fixed cost alert was created
        if (newlyTriggeredAlert) {
          const alertObj: AppNotification = newlyTriggeredAlert;
          setToastNotification({
            id: alertObj.id,
            title: language === 'bn' ? (alertObj.titleBn || alertObj.title) : alertObj.title,
            message: language === 'bn' ? (alertObj.messageBn || alertObj.message) : alertObj.message,
            type: alertObj.type === 'alert' ? 'warning' : alertObj.type
          });
        }
      } catch (err) {
        console.error("Error checking fixed cost due notifications:", err);
      }
    };

    checkFixedCostNotifications();

    window.addEventListener('finflow_fixed_costs_updated', checkFixedCostNotifications);
    window.addEventListener('storage', checkFixedCostNotifications);

    return () => {
      window.removeEventListener('finflow_fixed_costs_updated', checkFixedCostNotifications);
      window.removeEventListener('storage', checkFixedCostNotifications);
    };
  }, [isAuthReady, currency, language]);

  // Real-time Transactions
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;

    // Simplified query to avoid composite index requirement
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      // Sort client-side to avoid index issues
      txs.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        
        // Fallback to ID or other stable property if dates are equal
        return b.id.localeCompare(a.id);
      });
      
      setTransactions(txs);
      setIsTransactionsLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
      setIsTransactionsLoaded(true);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const previousBalance = useMemo(() => {
    if (!transactions.length) return 0;
    
    // Determine the start date of the current filtered period
    let startDate: Date;
    if (timeFilter === 'all') return 0;
    
    if (timeFilter === 'yearly') {
      startDate = new Date(selectedYear, 0, 1);
    } else if (timeFilter === 'monthly') {
      startDate = new Date(selectedYear, selectedMonth, 1);
    } else if (timeFilter === 'weekly') {
      const startDay = (selectedWeek - 1) * 7 + 1;
      startDate = new Date(selectedYear, selectedMonth, startDay);
    } else if (timeFilter === 'custom' && customStartDate) {
      startDate = parseLocalDate(customStartDate);
    } else {
      return 0;
    }

    // Sum all transactions BEFORE this start date
    return transactions
      .filter(t => parseLocalDate(t.date) < startDate)
      .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }, [transactions, timeFilter, selectedMonth, selectedYear, selectedWeek, customStartDate]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // 1. Time / Date filter
    if (timeFilter !== 'all') {
      result = result.filter(t => {
        const tDate = parseLocalDate(t.date);
        const tYear = tDate.getFullYear();
        const tMonth = tDate.getMonth();
        const tDay = tDate.getDate();

        if (timeFilter === 'monthly') {
          return tMonth === selectedMonth && tYear === selectedYear;
        }

        if (timeFilter === 'yearly') {
          return tYear === selectedYear;
        }

        if (timeFilter === 'weekly') {
          const startDay = (selectedWeek - 1) * 7 + 1;
          const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
          let endDay = selectedWeek * 7;
          if (endDay > daysInMonth) endDay = daysInMonth;
          if (selectedWeek === 5 && startDay > daysInMonth) return false;

          return tYear === selectedYear && tMonth === selectedMonth && tDay >= startDay && tDay <= endDay;
        }

        if (timeFilter === 'custom') {
          if (customStartDate && t.date < customStartDate) return false;
          if (customEndDate && t.date > customEndDate) return false;
          return true;
        }

        return true;
      });
    }

    // 2. Type filter (all, income, expense)
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    // 3. Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // 4. Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        (t.description || '').toLowerCase().includes(query) || 
        (t.category || '').toLowerCase().includes(query) ||
        (t.customCategory && t.customCategory.toLowerCase().includes(query))
      );
    }

    return result;
  }, [transactions, timeFilter, selectedMonth, selectedYear, selectedWeek, customStartDate, customEndDate, typeFilter, categoryFilter, searchQuery]);

  // Reliable mobile & desktop download helper supporting Android APK, Web Share API, and Blob download
  const downloadBlob = async (blob: Blob, filename: string) => {
    const isAndroid = isAndroidDevice();

    // For Android, try Web Share API with File first if supported
    if (isAndroid && typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
            text: filename,
          });
          return;
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') return;
        console.warn('Android downloadBlob share failed, falling back to anchor:', shareErr);
      }
    }

    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.position = 'fixed';
      a.style.left = '-9999px';
      a.style.top = '0';
      a.href = url;
      a.download = filename;
      a.setAttribute('download', filename);
      a.target = '_blank';

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        try {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 4000);
    } catch (downloadErr) {
      console.error('Anchor download failed, fallback to location href:', downloadErr);
      const url = URL.createObjectURL(blob);
      window.location.href = url;
    }
  };

  const saveAndSharePdfOnAndroid = async (
    blob: Blob,
    filename: string,
    pureBase64: string
  ): Promise<{ success: boolean; uri?: string; method?: string }> => {
    const isBn = language === 'bn';
    const win = window as any;

    // 1. Primary: Native Capacitor Filesystem & Share APIs
    try {
      // Check and request storage permissions on Android if needed
      try {
        if (typeof Filesystem.checkPermissions === 'function') {
          const perm = await Filesystem.checkPermissions();
          if (perm && perm.publicStorage !== 'granted' && typeof Filesystem.requestPermissions === 'function') {
            await Filesystem.requestPermissions();
          }
        }
      } catch (permErr) {
        console.warn('Filesystem permissions check/request:', permErr);
      }

      let writtenUri = '';
      let targetDir = Directory.Documents;

      // Attempt A: Save directly to device public Documents folder
      try {
        const writeRes = await Filesystem.writeFile({
          path: filename,
          data: pureBase64,
          directory: Directory.Documents,
          recursive: true,
        });
        if (writeRes?.uri) {
          writtenUri = writeRes.uri;
        }
      } catch (docErr) {
        console.warn('Filesystem.writeFile to Directory.Documents failed, trying Directory.Cache:', docErr);
        // Attempt B: Save to Cache directory (writable without special permissions on Android)
        try {
          const cacheRes = await Filesystem.writeFile({
            path: filename,
            data: pureBase64,
            directory: Directory.Cache,
            recursive: true,
          });
          if (cacheRes?.uri) {
            writtenUri = cacheRes.uri;
            targetDir = Directory.Cache;
          }
        } catch (cacheErr) {
          console.warn('Filesystem.writeFile to Directory.Cache failed:', cacheErr);
        }
      }

      // If file was written to disk via Capacitor Filesystem
      if (writtenUri) {
        // Trigger Android native Share/Save/Open sheet using @capacitor/share
        let sharedNatively = false;
        try {
          await Share.share({
            title: filename,
            text: isBn ? 'ডিজিটাল হিসাব লেনদেন বিবরণী রিপোর্ট' : 'Digital Hishab Statement',
            dialogTitle: isBn ? 'পিডিএফ ফাইল ওপেন বা সেভ করুন' : 'Open or Save PDF File',
            files: [writtenUri],
          });
          sharedNatively = true;
        } catch (shareErr: any) {
          // If the user dismissed or completed the system intent, it is still a success
          if (shareErr?.name === 'AbortError' || shareErr?.message?.includes('canceled') || shareErr?.message?.includes('dismissed')) {
            sharedNatively = true;
          } else {
            console.warn('Capacitor Share failed with URI:', shareErr);
          }
        }

        return {
          success: true,
          uri: writtenUri,
          method: targetDir === Directory.Documents ? 'capacitor_documents' : 'capacitor_cache'
        };
      }
    } catch (capErr) {
      console.warn('Capacitor native filesystem/share pipeline encountered an issue:', capErr);
    }

    // 2. Secondary: Android APK WebView Native JS interfaces (e.g. Android DownloadManager bridge)
    if (win.Android) {
      try {
        if (typeof win.Android.downloadFile === 'function') {
          win.Android.downloadFile(pureBase64, filename, 'application/pdf');
          return { success: true, method: 'android_bridge' };
        } else if (typeof win.Android.saveFile === 'function') {
          win.Android.saveFile(pureBase64, filename);
          return { success: true, method: 'android_bridge' };
        } else if (typeof win.Android.saveBlob === 'function') {
          win.Android.saveBlob(pureBase64, filename);
          return { success: true, method: 'android_bridge' };
        } else if (typeof win.Android.shareFile === 'function') {
          win.Android.shareFile(pureBase64, filename);
          return { success: true, method: 'android_bridge' };
        } else if (typeof win.Android.postMessage === 'function') {
          win.Android.postMessage(JSON.stringify({
            action: 'download',
            filename,
            mimeType: 'application/pdf',
            data: pureBase64
          }));
          return { success: true, method: 'android_bridge' };
        }
      } catch (bridgeErr) {
        console.warn('Android native bridge call failed:', bridgeErr);
      }
    } else if (win.AndroidBridge) {
      try {
        if (typeof win.AndroidBridge.downloadFile === 'function') {
          win.AndroidBridge.downloadFile(pureBase64, filename, 'application/pdf');
          return { success: true, method: 'android_bridge' };
        } else if (typeof win.AndroidBridge.saveFile === 'function') {
          win.AndroidBridge.saveFile(pureBase64, filename);
          return { success: true, method: 'android_bridge' };
        }
      } catch (bridgeErr) {
        console.warn('AndroidBridge call failed:', bridgeErr);
      }
    } else if (win.JSBridge && typeof win.JSBridge.downloadFile === 'function') {
      try {
        win.JSBridge.downloadFile(pureBase64, filename, 'application/pdf');
        return { success: true, method: 'android_bridge' };
      } catch (bridgeErr) {
        console.warn('JSBridge call failed:', bridgeErr);
      }
    }

    // 3. Tertiary: Web Share API with File object
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const pdfFile = new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() });
        if (navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            files: [pdfFile],
            title: isBn ? 'ডিজিটাল হিসাব লেনদেন বিবরণী' : 'Digital Hishab Statement',
            text: isBn ? `${filename} ডাউনলোড ও সংরক্ষণ করুন` : `Save or share ${filename}`,
          });
          return { success: true, method: 'web_share' };
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { success: true, method: 'web_share' };
        }
        console.warn('Android navigator.share fallback failed:', shareErr);
      }
    }

    return { success: false };
  };

  const handleAndroidDirectSave = async () => {
    if (!androidPdfModal) return;
    const isBn = language === 'bn';
    const filename = androidPdfModal.filename;
    const pureBase64 = androidPdfModal.pureBase64 || 
      (androidPdfModal.base64DataUri?.includes(',') ? androidPdfModal.base64DataUri.split(',')[1] : androidPdfModal.base64DataUri) || '';

    // 1. Try Capacitor Filesystem save directly to Directory.Documents
    if (pureBase64) {
      try {
        try {
          if (typeof Filesystem.checkPermissions === 'function') {
            const perm = await Filesystem.checkPermissions();
            if (perm && perm.publicStorage !== 'granted' && typeof Filesystem.requestPermissions === 'function') {
              await Filesystem.requestPermissions();
            }
          }
        } catch {
          // ignore
        }

        const writeRes = await Filesystem.writeFile({
          path: filename,
          data: pureBase64,
          directory: Directory.Documents,
          recursive: true,
        });

        if (writeRes && writeRes.uri) {
          // Trigger system share/open with the written URI
          try {
            await Share.share({
              title: filename,
              dialogTitle: isBn ? 'পিডিএফ ফাইল সংরক্ষণ বা ওপেন করুন' : 'Save or Open PDF',
              files: [writeRes.uri],
            });
          } catch {
            // ignore
          }

          setAndroidPdfModal(null);
          pushNotification({
            id: 'save-android-' + Date.now(),
            title: isBn ? 'ডকুমেন্টস ফোল্ডারে সংরক্ষিত' : 'Saved to Documents',
            message: isBn ? 'পিডিএফ ফাইলটি আপনার ডিভাইসের Documents ফোল্ডারে সংরক্ষিত হয়েছে।' : 'PDF file has been saved to your device Documents folder.',
            type: 'success'
          });
          return;
        }
      } catch (capErr) {
        console.warn('Capacitor direct save to Documents failed, falling back:', capErr);
      }
    }

    // 2. Android APK native JavaScript interfaces
    const win = window as any;
    if (pureBase64) {
      if (win.Android) {
        if (typeof win.Android.downloadFile === 'function') {
          win.Android.downloadFile(pureBase64, filename, 'application/pdf');
          setAndroidPdfModal(null);
          return;
        }
        if (typeof win.Android.saveFile === 'function') {
          win.Android.saveFile(pureBase64, filename);
          setAndroidPdfModal(null);
          return;
        }
      }
      if (win.AndroidBridge && typeof win.AndroidBridge.downloadFile === 'function') {
        win.AndroidBridge.downloadFile(pureBase64, filename, 'application/pdf');
        setAndroidPdfModal(null);
        return;
      }
    }

    // 3. Fallback: Octet stream anchor
    try {
      const octetUri = (androidPdfModal.base64DataUri || '').replace('application/pdf', 'application/octet-stream');
      const a = document.createElement('a');
      a.href = octetUri || (androidPdfModal.blob ? URL.createObjectURL(androidPdfModal.blob) : '');
      a.download = filename;
      a.setAttribute('download', filename);
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 3000);
    } catch (e) {
      console.error('Direct save error:', e);
    }

    setAndroidPdfModal(null);
    pushNotification({
      id: 'save-android-' + Date.now(),
      title: isBn ? 'ডাউনলোড সম্পন্ন' : 'Saved',
      message: isBn ? 'ফাইলটি আপনার ডিভাইসে সংরক্ষিত হয়েছে।' : 'File saved to your Android device.',
      type: 'success'
    });
  };

  const exportToPDF = async () => {
    const isBn = language === 'bn';
    if (filteredTransactions.length === 0) {
      pushNotification({
        id: 'exp-empty-' + Date.now(),
        title: isBn ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No Transactions Found',
        titleBn: 'কোনো লেনদেন পাওয়া যায়নি',
        message: isBn ? 'আপনার বর্তমান সক্রিয় ফিল্টারের সাথে মিলে এমন কোনো লেনদেন নেই।' : 'No transactions match your currently selected filters to export.',
        messageBn: 'আপনার বর্তমান সক্রিয় ফিল্টারের সাথে মিলে এমন কোনো লেনদেন নেই।',
        type: 'warning'
      });
      return;
    }

    setIsExportingPDF(true);
    let container: HTMLDivElement | null = null;
    try {
      // Calculate totals based strictly on filtered transactions
      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netBalance = totalIncome - totalExpense;

      // Format amounts
      const totalIncomeFormatted = isBn ? `${formatNumber(totalIncome, 'bn')} ৳` : `${totalIncome.toLocaleString()} BDT`;
      const totalExpenseFormatted = isBn ? `${formatNumber(totalExpense, 'bn')} ৳` : `${totalExpense.toLocaleString()} BDT`;
      const netBalanceFormatted = isBn ? `${formatNumber(netBalance, 'bn')} ৳` : `${netBalance.toLocaleString()} BDT`;

      const formattedDate = isBn ? toBanglaNumerals(new Date().toLocaleDateString('bn-BD')) : new Date().toLocaleDateString();

      // Build active filters summary for the report header
      const filterPills: string[] = [];
      if (timeFilter === 'monthly') {
        const monthDate = new Date(selectedYear, selectedMonth, 1);
        const monthName = monthDate.toLocaleString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
        filterPills.push(isBn ? `মাস: ${monthName}` : `Month: ${monthName}`);
      } else if (timeFilter === 'weekly') {
        const monthDate = new Date(selectedYear, selectedMonth, 1);
        const monthName = monthDate.toLocaleString(isBn ? 'bn-BD' : 'en-US', { month: 'short', year: 'numeric' });
        const weekLabel = isBn ? `${formatNumber(selectedWeek, 'bn')} তম সপ্তাহ` : `Week ${selectedWeek}`;
        filterPills.push(isBn ? `সময়কাল: ${weekLabel}, ${monthName}` : `Period: ${weekLabel}, ${monthName}`);
      } else if (timeFilter === 'yearly') {
        filterPills.push(isBn ? `বছর: ${toBanglaNumerals(String(selectedYear))}` : `Year: ${selectedYear}`);
      } else if (timeFilter === 'custom') {
        const s = customStartDate ? (isBn ? toBanglaNumerals(customStartDate) : customStartDate) : '...';
        const e = customEndDate ? (isBn ? toBanglaNumerals(customEndDate) : customEndDate) : '...';
        filterPills.push(isBn ? `তারিখ পরিসীমা: ${s} থেকে ${e}` : `Date Range: ${s} to ${e}`);
      } else {
        filterPills.push(isBn ? 'সময়কাল: সর্বকালীন' : 'Period: All Time');
      }

      if (typeFilter !== 'all') {
        filterPills.push(isBn ? `ধরন: ${typeFilter === 'income' ? 'শুধু আয় (+)' : 'শুধু ব্যয় (-)'}` : `Type: ${typeFilter.toUpperCase()}`);
      }

      if (categoryFilter !== 'all') {
        filterPills.push(isBn ? `ক্যাটাগরি: ${getTranslatedCategory(categoryFilter)}` : `Category: ${categoryFilter}`);
      }

      if (searchQuery.trim()) {
        filterPills.push(isBn ? `অনুসন্ধান: "${searchQuery}"` : `Search: "${searchQuery}"`);
      }

      const activeFilterString = filterPills.join('  •  ');

      // Setup off-screen multi-page container
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.zIndex = '-9999';
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.style.pointerEvents = 'none';
      container.style.width = '800px';
      container.style.backgroundColor = '#FFFFFF';
      document.body.appendChild(container);

      const tableHeadHtml = `
        <thead>
          <tr style="background: linear-gradient(90deg, #059669 0%, #047857 100%); color: #ffffff;">
            <th style="padding: 10px 12px; font-weight: 700; border: none; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 15%; text-align: left; font-size: 11px; letter-spacing: 0.3px; border-top-left-radius: 6px;">${isBn ? "তারিখ" : "Date"}</th>
            <th style="padding: 10px 12px; font-weight: 700; border: none; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 13%; text-align: center; font-size: 11px; letter-spacing: 0.3px;">${isBn ? "ধরন" : "Type"}</th>
            <th style="padding: 10px 12px; font-weight: 700; border: none; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 20%; text-align: left; font-size: 11px; letter-spacing: 0.3px;">${isBn ? "ক্যাটাগরি" : "Category"}</th>
            <th style="padding: 10px 12px; font-weight: 700; border: none; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 32%; text-align: left; font-size: 11px; letter-spacing: 0.3px;">${isBn ? "বিবরণ" : "Description"}</th>
            <th style="padding: 10px 12px; font-weight: 700; border: none; text-align: right; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 20%; font-size: 11px; letter-spacing: 0.3px; border-top-right-radius: 6px;">${isBn ? "পরিমাণ" : "Amount"}</th>
          </tr>
        </thead>
      `;

      const createPage = (isFirst: boolean) => {
        const page = document.createElement('div');
        page.style.width = '800px';
        page.style.height = '1131px';
        page.style.minHeight = '1131px';
        page.style.maxHeight = '1131px';
        page.style.overflow = 'hidden';
        page.style.position = 'relative';
        page.style.boxSizing = 'border-box';
        page.style.padding = '40px 48px 60px 48px';
        page.style.backgroundColor = '#FFFFFF';
        page.style.color = '#1E293B';
        page.style.fontFamily = '"Plus Jakarta Sans", "Noto Sans Bengali", "Hind Siliguri", sans-serif';

        if (isFirst) {
          page.innerHTML = `
            <!-- Top Accent Bar -->
            <div style="height: 5px; background: linear-gradient(90deg, #10b981 0%, #059669 100%); margin-bottom: 20px; border-radius: 3px;"></div>
            
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
              <div style="max-width: 62%;">
                <h1 style="font-size: 24px; font-weight: 800; color: #059669; margin: 0; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; letter-spacing: -0.5px;">
                  ${isBn ? "ডিজিটাল হিসাব" : "Digital Hishab"}
                </h1>
                <p style="font-size: 12.5px; color: #475569; margin: 4px 0 0 0; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; font-weight: 500;">
                  ${isBn ? "লেনদেনের সামগ্রিক বিবরণী ও আর্থিক প্রতিবেদন" : "Overall Transaction Statement & Financial Report"}
                </p>
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 4px 10px; margin-top: 8px; font-size: 11px; color: #065f46; font-weight: 600; display: inline-block;">
                  <span style="font-weight: 800; color: #047857;">${isBn ? 'সক্রিয় ফিল্টার: ' : 'Active Filters: '}</span>
                  ${activeFilterString}
                </div>
              </div>
              <div style="text-align: right; font-size: 11px; color: #475569; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; line-height: 1.6;">
                <p style="margin: 0;"><strong style="color: #64748b;">${isBn ? "ব্যবহারকারী:" : "User:"}</strong> <span style="color: #0f172a; font-weight: 600;">${userEmail}</span></p>
                <p style="margin: 2px 0 0 0;"><strong style="color: #64748b;">${isBn ? "তারিখ:" : "Date:"}</strong> <span style="color: #0f172a; font-weight: 600;">${formattedDate}</span></p>
                <p style="margin: 2px 0 0 0;"><strong style="color: #64748b;">${isBn ? "নির্বাচিত রেকর্ড:" : "Selected Records:"}</strong> <span style="color: #059669; font-weight: 700;">${isBn ? toBanglaNumerals(String(filteredTransactions.length)) : filteredTransactions.length}</span></p>
              </div>
            </div>

            <!-- Cards Summary -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px;">
              <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 10px; padding: 12px 14px; text-align: center;">
                <span style="font-size: 10.5px; font-weight: 700; color: #166534; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  ${isBn ? "মোট আয়" : "Total Income"}
                </span>
                <span style="font-size: 17px; font-weight: 800; color: #15803d; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  ${totalIncomeFormatted}
                </span>
              </div>
              <div style="background-color: #fff5f5; border: 1px solid #fee2e2; border-radius: 10px; padding: 12px 14px; text-align: center;">
                <span style="font-size: 10.5px; font-weight: 700; color: #991b1b; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  ${isBn ? "মোট ব্যয়" : "Total Expense"}
                </span>
                <span style="font-size: 17px; font-weight: 800; color: #b91c1c; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  ${totalExpenseFormatted}
                </span>
              </div>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; text-align: center;">
                <span style="font-size: 10.5px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  ${isBn ? "বর্তমান ব্যালেন্স" : "Net Balance"}
                </span>
                <span style="font-size: 17px; font-weight: 800; color: ${netBalance >= 0 ? '#0f172a' : '#b91c1c'}; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  ${netBalanceFormatted}
                </span>
              </div>
            </div>

            <!-- Table Title -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; border-left: 4px solid #10b981; padding-left: 8px; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                ${isBn ? "ফিল্টার করা লেনদেন বিবরণী" : "Filtered Transaction Statement"}
              </h3>
              <span style="font-size: 10.5px; color: #64748b; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                ${isBn ? "সর্বমোট: " : "Total: "} <strong>${isBn ? toBanglaNumerals(String(filteredTransactions.length)) : filteredTransactions.length}</strong>
              </span>
            </div>

            <!-- Table Container -->
            <table class="pdf-table" style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; background-color: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              ${tableHeadHtml}
              <tbody></tbody>
            </table>

            <!-- Page 1 Footer -->
            <div class="pdf-footer" style="position: absolute; bottom: 20px; left: 48px; right: 48px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
              <span style="font-weight: 500;">Digital Hishab • ${isBn ? "লেনদেন বিবরণী" : "Transaction Statement"}</span>
              <span class="pdf-page-num" style="font-weight: 700; color: #475569;">Page 1</span>
            </div>
          `;
        } else {
          page.innerHTML = `
            <!-- Top Accent Bar -->
            <div style="height: 4px; background: linear-gradient(90deg, #10b981 0%, #059669 100%); margin-bottom: 16px; border-radius: 2px;"></div>
            
            <!-- Continued Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 14px;">
              <div>
                <h2 style="font-size: 16px; font-weight: 800; color: #059669; margin: 0; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  ${isBn ? "ডিজিটাল হিসাব — লেনদেন বিবরণী (চলমান)" : "Digital Hishab — Transaction Statement (Cont.)"}
                </h2>
                <p style="font-size: 10.5px; color: #64748b; margin: 3px 0 0 0; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                  <strong style="color: #047857;">${isBn ? 'সক্রিয় ফিল্টার: ' : 'Active Filters: '}</strong> ${activeFilterString}
                </p>
              </div>
              <div style="text-align: right; font-size: 10.5px; color: #475569; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
                <p style="margin: 0;"><strong>${isBn ? "তারিখ:" : "Date:"}</strong> ${formattedDate}</p>
              </div>
            </div>

            <!-- Repeated Table Header on each page -->
            <table class="pdf-table" style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; background-color: #FFFFFF; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              ${tableHeadHtml}
              <tbody></tbody>
            </table>

            <!-- Continuation Footer -->
            <div class="pdf-footer" style="position: absolute; bottom: 20px; left: 48px; right: 48px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; font-family: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;">
              <span style="font-weight: 500;">Digital Hishab • ${isBn ? "লেনদেন বিবরণী" : "Transaction Statement"}</span>
              <span class="pdf-page-num" style="font-weight: 700; color: #475569;">Page</span>
            </div>
          `;
        }
        return page;
      };

      const MAX_PAGE_CONTENT_BOTTOM = 1035; // Safe threshold before footer boundary (~1075px)

      const pages: HTMLDivElement[] = [];
      let currentPage = createPage(true);
      container.appendChild(currentPage);
      let currentTbody = currentPage.querySelector('tbody')!;

      // Add each transaction row and move to new page automatically when space runs out
      for (let idx = 0; idx < filteredTransactions.length; idx++) {
        const t = filteredTransactions[idx];
        const tr = document.createElement('tr');
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const cellBorder = '1px solid #e2e8f0';
        const isIncome = t.type === 'income';
        const cat = t.category === 'Other' ? (t.customCategory || 'Other') : t.category;
        const dateVal = isBn ? toBanglaNumerals(t.date) : t.date;
        const typeLabel = isBn ? (isIncome ? 'আয়' : 'ব্যয়') : (isIncome ? 'Income' : 'Expense');
        const categoryVal = isBn ? getTranslatedCategory(cat) : cat;
        const descVal = isBn ? getLocalizedDescription(t.description || '', language) : (t.description || '');
        const amountSign = isIncome ? '+' : '-';
        const amountVal = isBn 
          ? `${amountSign} ${formatNumber(t.amount, 'bn')} ৳` 
          : `${amountSign} BDT ${t.amount.toLocaleString()}`;

        tr.style.backgroundColor = rowBg;
        tr.innerHTML = `
          <td style="padding: 9px 12px; border-bottom: ${cellBorder}; border-right: ${cellBorder}; color: #475569; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 15%; font-size: 10.5px; vertical-align: middle;">${dateVal}</td>
          <td style="padding: 9px 12px; border-bottom: ${cellBorder}; border-right: ${cellBorder}; text-align: center; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 13%; vertical-align: middle;">
            <span style="display: inline-block; padding: 2.5px 8px; border-radius: 9999px; font-size: 9.5px; font-weight: 700; background-color: ${isIncome ? '#dcfce7' : '#fee2e2'}; color: ${isIncome ? '#15803d' : '#b91c1c'};">
              ${typeLabel}
            </span>
          </td>
          <td style="padding: 9px 12px; border-bottom: ${cellBorder}; border-right: ${cellBorder}; color: #1e293b; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; font-weight: 600; width: 20%; font-size: 10.5px; vertical-align: middle;">${categoryVal}</td>
          <td style="padding: 9px 12px; border-bottom: ${cellBorder}; border-right: ${cellBorder}; color: #334155; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 32%; font-size: 10.5px; word-break: break-word; overflow-wrap: break-word; line-height: 1.4; vertical-align: middle;">${descVal || '-'}</td>
          <td style="padding: 9px 12px; border-bottom: ${cellBorder}; text-align: right; font-weight: 800; color: ${isIncome ? '#15803d' : '#b91c1c'}; font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif; width: 20%; font-size: 11px; vertical-align: middle;">${amountVal}</td>
        `;

        currentTbody.appendChild(tr);

        // Check if row overflows page content boundary
        const pageRect = currentPage.getBoundingClientRect();
        const trRect = tr.getBoundingClientRect();
        const relativeBottom = trRect.bottom - pageRect.top;

        if (relativeBottom > MAX_PAGE_CONTENT_BOTTOM && currentTbody.children.length > 1) {
          // Remove complete row from current page to prevent cutoff
          currentTbody.removeChild(tr);
          pages.push(currentPage);

          // Create new page with repeated header at (0,0) for accurate measurement
          container.removeChild(currentPage);
          currentPage = createPage(false);
          container.appendChild(currentPage);
          currentTbody = currentPage.querySelector('tbody')!;
          currentTbody.appendChild(tr);
        }
      }

      // Add the final page
      pages.push(currentPage);

      // Update page numbers across all pages
      const totalPages = pages.length;
      pages.forEach((p, pIdx) => {
        const pageNumEl = p.querySelector('.pdf-page-num');
        if (pageNumEl) {
          pageNumEl.textContent = isBn 
            ? `পৃষ্ঠা ${toBanglaNumerals(pIdx + 1)} / ${toBanglaNumerals(totalPages)}`
            : `Page ${pIdx + 1} of ${totalPages}`;
        }
      });

      // Wait for font ready & paint
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Capture each page individually at top 0, left 0 to ensure flawless html2canvas rendering
      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const p = pages[pIdx];
        container.innerHTML = '';
        container.appendChild(p);

        const canvas = await html2canvas(p, {
          scale: 2, // 2x gives razor sharp text rendering
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          width: 800,
          height: 1131,
          windowWidth: 800,
          windowHeight: 1131,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/png');
        if (pIdx > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const periodSuffix = timeFilter === 'monthly' ? `_${selectedYear}_${selectedMonth + 1}` : timeFilter === 'yearly' ? `_${selectedYear}` : '';
      const filename = isBn ? `digital_hishab_report${periodSuffix}_bn.pdf` : `digital_hishab_report${periodSuffix}.pdf`;
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf', lastModified: Date.now() });

      // Convert to Base64 data URI for Android bridges and APK download listeners
      const base64DataUri = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.readAsDataURL(pdfBlob);
      });
      const pureBase64 = base64DataUri.includes(',') ? base64DataUri.split(',')[1] : base64DataUri;

      // Handle Android APK and Android devices specifically without relying on browser download or pdf.save()
      if (isAndroidDevice() || (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform())) {
        const androidResult = await saveAndSharePdfOnAndroid(pdfBlob, filename, pureBase64);

        if (androidResult.success) {
          pushNotification({
            id: 'exp-pdf-' + Date.now(),
            title: isBn ? 'পিডিএফ প্রস্তুত ও সংরক্ষিত' : 'PDF Saved / Opened',
            titleBn: 'পিডিএফ প্রস্তুত ও সংরক্ষিত',
            message: isBn 
              ? 'অ্যান্ড্রয়েড ডিভাইসের ডকুমেন্টস বা শেয়ার ডায়ালগের মাধ্যমে ফাইলটি সফলভাবে সংরক্ষিত হয়েছে।' 
              : 'PDF file was successfully saved to your Android device or opened in share sheet.',
            messageBn: 'অ্যান্ড্রয়েড ডিভাইসের ডকুমেন্টস বা শেয়ার ডায়ালগের মাধ্যমে ফাইলটি সফলভাবে সংরক্ষিত হয়েছে।',
            type: 'success'
          });
          return;
        }

        // Fallback: Open Android Save/Share Sheet with 1-tap fresh user gesture
        setAndroidPdfModal({
          isOpen: true,
          blob: pdfBlob,
          filename,
          file: pdfFile,
          base64DataUri,
          fileUri: androidResult.uri,
          pureBase64,
        });
        return;
      }

      // Non-Android platforms (desktop browsers, etc.)
      try {
        pdf.save(filename);
      } catch (saveErr) {
        console.warn('pdf.save fallback triggered:', saveErr);
        await downloadBlob(pdfBlob, filename);
      }

      pushNotification({
        id: 'exp-pdf-' + Date.now(),
        title: isBn ? 'পিডিএফ প্রস্তুত' : 'PDF Downloaded',
        titleBn: 'পিডিএফ প্রস্তুত',
        message: isBn ? `${filteredTransactions.length} টি নির্বাচিত লেনদেনের রিপোর্ট ডাউনলোড হয়েছে।` : `Downloaded report with ${filteredTransactions.length} selected transactions.`,
        messageBn: `${filteredTransactions.length} টি নির্বাচিত লেনদেনের রিপোর্ট ডাউনলোড হয়েছে।`,
        type: 'success'
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      pushNotification({
        id: 'exp-err-' + Date.now(),
        title: 'Export Failed',
        titleBn: 'পিডিএফ এক্সপোর্ট ব্যর্থ',
        message: 'Failed to generate PDF. Please try again.',
        messageBn: 'পিডিএফ ফাইলে কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        type: 'warning'
      });
    } finally {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setIsExportingPDF(false);
    }
  };

  const exportToExcel = async () => {
    const isBn = language === 'bn';
    if (filteredTransactions.length === 0) {
      pushNotification({
        id: 'exp-empty-' + Date.now(),
        title: isBn ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No Transactions Found',
        titleBn: 'কোনো লেনদেন নেই',
        message: isBn ? 'আপনার বর্তমান সক্রিয় ফিল্টারের সাথে মিলে এমন কোনো লেনদেন নেই।' : 'No transactions match your currently selected filters to export.',
        messageBn: 'আপনার বর্তমান সক্রিয় ফিল্টারের সাথে মিলে এমন কোনো লেনদেন নেই।',
        type: 'warning'
      });
      return;
    }

    setIsExportingExcel(true);
    try {
      const data = filteredTransactions.map(t => {
        const cat = t.category === 'Other' ? (t.customCategory || 'Other') : t.category;
        if (isBn) {
          return {
            'তারিখ': toBanglaNumerals(t.date),
            'ধরন': t.type === 'income' ? 'আয়' : 'ব্যয়',
            'ক্যাটাগরি': getTranslatedCategory(cat),
            'বিবরণ': getLocalizedDescription(t.description || '', language),
            'পরিমাণ': t.amount
          };
        } else {
          return {
            'Date': t.date,
            'Type': t.type.toUpperCase(),
            'Category': cat,
            'Description': t.description || '',
            'Amount': t.amount
          };
        }
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isBn ? "লেনদেনসমূহ" : "Transactions");
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const periodSuffix = timeFilter === 'monthly' ? `_${selectedYear}_${selectedMonth + 1}` : timeFilter === 'yearly' ? `_${selectedYear}` : '';
      const filename = isBn ? `digital_hishab_report${periodSuffix}_bn.xlsx` : `digital_hishab_report${periodSuffix}.xlsx`;
      
      await downloadBlob(blob, filename);

      pushNotification({
        id: 'exp-xlsx-' + Date.now(),
        title: isBn ? 'এক্সেল ফাইল প্রস্তুত' : 'Excel Downloaded',
        titleBn: 'এক্সেল ফাইল প্রস্তুত',
        message: isBn ? `${filteredTransactions.length} টি নির্বাচিত লেনদেনের এক্সেল ফাইল ডাউনলোড হয়েছে।` : `Downloaded Excel spreadsheet with ${filteredTransactions.length} selected transactions.`,
        messageBn: `${filteredTransactions.length} টি নির্বাচিত লেনদেনের এক্সেল ফাইল ডাউনলোড হয়েছে।`,
        type: 'success'
      });
    } catch (error) {
      console.error("Excel Export Error:", error);
      pushNotification({
        id: 'exp-err-' + Date.now(),
        title: 'Export Failed',
        titleBn: 'এক্সেল এক্সপোর্ট ব্যর্থ',
        message: 'Failed to generate Excel file. Please try again.',
        messageBn: 'এক্সেল ফাইলে কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        type: 'warning'
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const exportToCSV = async () => {
    const isBn = language === 'bn';
    if (filteredTransactions.length === 0) {
      pushNotification({
        id: 'exp-empty-' + Date.now(),
        title: isBn ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No Transactions Found',
        titleBn: 'কোনো লেনদেন নেই',
        message: isBn ? 'আপনার বর্তমান সক্রিয় ফিল্টারের সাথে মিলে এমন কোনো লেনদেন নেই।' : 'No transactions match your currently selected filters to export.',
        messageBn: 'আপনার বর্তমান সক্রিয় ফিল্টারের সাথে মিলে এমন কোনো লেনদেন নেই।',
        type: 'warning'
      });
      return;
    }

    setIsExportingCSV(true);
    try {
      const headers = isBn
        ? ['তারিখ', 'ধরন', 'ক্যাটাগরি', 'বিবরণ', 'পরিমাণ']
        : ['Date', 'Type', 'Category', 'Description', 'Amount'];
      
      const rows = filteredTransactions.map(t => {
        const cat = t.category === 'Other' ? (t.customCategory || 'Other') : t.category;
        const dateVal = isBn ? toBanglaNumerals(t.date) : t.date;
        const typeVal = isBn 
          ? (t.type === 'income' ? 'আয়' : 'ব্যয়') 
          : t.type.toUpperCase();
        const categoryVal = isBn ? getTranslatedCategory(cat) : cat;
        const descVal = isBn ? getLocalizedDescription(t.description || '', language) : (t.description || '');
        const amountVal = isBn ? formatNumber(t.amount, 'bn') : t.amount;
        
        return [
          dateVal,
          typeVal,
          categoryVal,
          `"${(descVal || '').replace(/"/g, '""')}"`,
          amountVal
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const periodSuffix = timeFilter === 'monthly' ? `_${selectedYear}_${selectedMonth + 1}` : timeFilter === 'yearly' ? `_${selectedYear}` : '';
      const filename = isBn ? `digital_hishab_report${periodSuffix}_bn.csv` : `digital_hishab_report${periodSuffix}.csv`;

      await downloadBlob(blob, filename);

      pushNotification({
        id: 'exp-csv-' + Date.now(),
        title: isBn ? 'সিএসভি ফাইল প্রস্তুত' : 'CSV Downloaded',
        titleBn: 'সিএসভি ফাইল প্রস্তুত',
        message: isBn ? `${filteredTransactions.length} টি নির্বাচিত লেনদেনের সিএসভি ফাইল ডাউনলোড হয়েছে।` : `Downloaded CSV file with ${filteredTransactions.length} selected transactions.`,
        messageBn: `${filteredTransactions.length} টি নির্বাচিত লেনদেনের সিএসভি ফাইল ডাউনলোড হয়েছে।`,
        type: 'success'
      });
    } catch (error) {
      console.error("CSV Export Error:", error);
      pushNotification({
        id: 'exp-err-' + Date.now(),
        title: 'Export Failed',
        titleBn: 'সিএসভি এক্সপোর্ট ব্যর্থ',
        message: 'Failed to generate CSV file. Please try again.',
        messageBn: 'সিএসভি ফাইলে কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        type: 'warning'
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setNotifications([]);
      setTransactions([]);
      setBudget(0);
      dismissedAlertsRef.current.clear();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      const isIncome = transaction.type === 'income';
      const categoryDisplayBn = getTranslatedCategory(transaction.category);
      pushNotification({
        id: 'tx-' + Date.now(),
        title: isIncome ? 'Income Recorded' : 'Expense Recorded',
        titleBn: isIncome ? 'আয় নথিভুক্ত হয়েছে' : 'ব্যয় নথিভুক্ত হয়েছে',
        message: isIncome 
          ? `Added ${currency}${formatNumber(transaction.amount, 'en')} from ${transaction.category}.`
          : `Recorded ${currency}${formatNumber(transaction.amount, 'en')} for ${transaction.category}.`,
        messageBn: isIncome 
          ? `${categoryDisplayBn} থেকে ${currency}${formatNumber(transaction.amount, 'bn')} যোগ করা হয়েছে।`
          : `${categoryDisplayBn}-এর জন্য ${currency}${formatNumber(transaction.amount, 'bn')} নথিভুক্ত করা হয়েছে।`,
        type: isIncome ? 'success' : 'info'
      });
      setActiveTab('history');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const handleApplyFixedCosts = async (items: Omit<Transaction, 'id'>[]) => {
    if (!auth.currentUser || items.length === 0) return;
    try {
      for (const item of items) {
        await addDoc(collection(db, 'transactions'), {
          ...item,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }
      pushNotification({
        id: 'fc-' + Date.now(),
        title: 'Fixed Costs Applied',
        titleBn: 'নির্দিষ্ট খরচ যুক্ত হয়েছে',
        message: `Applied ${items.length} fixed expense(s) to this month's transactions.`,
        messageBn: `চলতি মাসের হিসাবে ${toBanglaNumerals(String(items.length))}টি নির্দিষ্ট খরচ যুক্ত করা হয়েছে।`,
        type: 'success'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const deleteTransaction = async (id: string) => {
    const targetTx = transactions.find(t => t.id === id);
    if (targetTx && targetTx.type === 'income') {
      const overallBalance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
      const proposedBalance = overallBalance - targetTx.amount;
      if (proposedBalance < 0) {
        setConfirmAction({
          title: language === 'en' ? "Deletion Error" : "মুছে ফেলা সংক্রান্ত সমস্যা",
          message: language === 'en'
            ? `Deleting this income entry would result in a negative total balance of ${currency}${formatNumber(proposedBalance, 'en')} in your account. Active expenses depend on this income source.`
            : `এই আয়ের বিবরণটি মুছে ফেললে আপনার অ্যাকাউন্টে ${currency}${formatNumber(proposedBalance, 'bn')} ঋণাত্মক ব্যালেন্স তৈরি হবে। সক্রিয় ব্যয়সমূহ এই আয়ের উৎসের ওপর নির্ভরশীল।`,
          isDanger: true,
          onConfirm: () => {}
        });
        setIsConfirmModalOpen(true);
        return;
      }
    }

    try {
      await deleteDoc(doc(db, 'transactions', id));
      if (targetTx) {
        const catBn = getTranslatedCategory(targetTx.category);
        pushNotification({
          id: 'del-' + Date.now(),
          title: 'Transaction Removed',
          titleBn: 'লেনদেন মুছে ফেলা হয়েছে',
          message: `Removed ${currency}${formatNumber(targetTx.amount, 'en')} (${targetTx.category}).`,
          messageBn: `${catBn} (${currency}${formatNumber(targetTx.amount, 'bn')}) মুছে ফেলা হয়েছে।`,
          type: 'info'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const updateTransaction = async (id: string, updatedData: Omit<Transaction, 'id'>) => {
    try {
      await updateDoc(doc(db, 'transactions', id), {
        ...updatedData
      });
      setEditingTransaction(null);
      const catBn = getTranslatedCategory(updatedData.category);
      pushNotification({
        id: 'tx-update-' + Date.now(),
        title: 'Transaction Updated',
        titleBn: 'লেনদেন পরিমার্জন করা হয়েছে',
        message: `Updated ${currency}${formatNumber(updatedData.amount, 'en')} (${updatedData.category}).`,
        messageBn: `${catBn} (${currency}${formatNumber(updatedData.amount, 'bn')}) পরিমার্জন করা হয়েছে।`,
        type: 'info'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    }
  };

  const updateBudget = async (newBudget: number) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        budget: newBudget
      });
      setBudget(newBudget);
      dismissedAlertsRef.current.delete('budget-exceeded');
      dismissedAlertsRef.current.delete('budget-80');
      saveDismissedAlerts(dismissedAlertsRef.current);
      pushNotification({
        id: 'budget-update-' + Date.now(),
        title: 'Budget Updated',
        titleBn: 'বাজেট আপডেট করা হয়েছে',
        message: `Your monthly budget has been updated to ${currency}${formatNumber(newBudget, 'en')}.`,
        messageBn: `আপনার মাসিক বাজেট ${currency}${formatNumber(newBudget, 'bn')} নির্ধারণ করা হয়েছে।`,
        type: 'success'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep" data-theme="light">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} language={language} onLanguageChange={changeLanguage} />;
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden flex flex-col md:flex-row">
      <div className="atmosphere" />
      
      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden w-[94%] max-w-md">
        <div className="backdrop-blur-3xl bg-glass/90 border border-glass-border/60 px-2 py-2 rounded-full flex items-center justify-around shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <NavButton 
            id="mobile-nav-overview"
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<LayoutDashboard size={18} />}
            label={t.home}
          />
          <NavButton 
            id="mobile-nav-add"
            active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')}
            icon={<Plus size={18} />}
            label={t.add}
          />
          <NavButton 
            id="mobile-nav-history"
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            icon={<History size={18} />}
            label={t.history}
          />
          <NavButton 
            id="mobile-nav-analytics"
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
            icon={<BarChart3 size={18} />}
            label={t.stats}
          />
          <NavButton 
            id="mobile-nav-budget"
            active={activeTab === 'budget'} 
            onClick={() => setActiveTab('budget')}
            icon={<Target size={18} />}
            label={t.budgetGoals}
          />
          <NavButton 
            id="mobile-nav-tools"
            active={activeTab === 'tools'} 
            onClick={() => {
              setActiveTab('tools');
              setActiveTool(null);
            }}
            icon={<Wrench size={18} />}
            label={t.tools}
          />
          <NavButton 
            id="mobile-nav-settings"
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={18} />}
            label={t.settings}
          />
        </div>
      </nav>

      {/* Desktop Navigation (Sidebar) */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 flex-col bg-glass/80 backdrop-blur-3xl border-r border-glass-border/40 p-6 z-50">
        <div className="flex items-center gap-3 mb-10 px-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/25 via-accent/10 to-transparent flex items-center justify-center border border-accent/30 shadow-[0_0_20px_var(--accent-glow)]">
            <Wallet size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-primary leading-tight">{t.appName}</h2>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <SidebarLink 
            id="tour-nav-dashboard"
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<LayoutDashboard size={20} />}
            label={t.dashboard}
          />
          <SidebarLink 
            id="tour-nav-add"
            active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')}
            icon={<Plus size={20} />}
            label={t.addTransaction}
          />
          <SidebarLink 
            id="tour-nav-history"
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            icon={<History size={20} />}
            label={t.transactionHistory}
          />
          <SidebarLink 
            id="tour-nav-analytics"
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
            icon={<BarChart3 size={20} />}
            label={t.visualAnalytics}
          />
          <SidebarLink 
            id="tour-nav-budget"
            active={activeTab === 'budget'} 
            onClick={() => setActiveTab('budget')}
            icon={<Target size={20} />}
            label={t.budgetGoals}
          />
          <SidebarLink 
            id="tour-nav-tools"
            active={activeTab === 'tools'} 
            onClick={() => {
              setActiveTab('tools');
              setActiveTool(null);
            }}
            icon={<Wrench size={20} />}
            label={t.toolsAndFeatures}
          />
          <SidebarLink 
            id="tour-nav-settings"
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={20} />}
            label={t.settings}
          />
        </div>

        <div className="pt-6 border-t border-glass-border/20">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-accent hover:bg-accent/5 rounded-xl transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-medium">{t.signOut}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 w-full px-4 sm:px-6 pt-8 sm:pt-12 pb-32 md:pb-12 overflow-y-auto">
        <AnimatePresence>
          {toastNotification && (
            <motion.div 
              key={toastNotification.id}
              initial={{ opacity: 0, y: -24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={() => {
                setIsNotificationsOpen(true);
                handleMarkRead(toastNotification.id);
                setToastNotification(null);
              }}
              className={cn(
                "fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[220] max-w-sm sm:max-w-md w-[calc(100vw-32px)] p-3.5 sm:p-4 rounded-2xl shadow-2xl border backdrop-blur-2xl cursor-pointer flex items-start gap-3 transition-all group",
                toastNotification.type === 'warning' || toastNotification.type === 'alert'
                  ? "bg-[var(--bg-deep)]/95 border-amber-500/40 text-primary shadow-amber-500/10"
                  : toastNotification.type === 'success'
                    ? "bg-[var(--bg-deep)]/95 border-emerald-500/40 text-primary shadow-emerald-500/10"
                    : "bg-[var(--bg-deep)]/95 border-accent/40 text-primary shadow-accent/10"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl shrink-0 mt-0.5 border",
                toastNotification.type === 'warning' || toastNotification.type === 'alert'
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : toastNotification.type === 'success'
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-sky-500/15 border-sky-500/30 text-sky-400"
              )}>
                {toastNotification.type === 'warning' || toastNotification.type === 'alert' ? <AlertCircle size={18} /> :
                 toastNotification.type === 'success' ? <CheckCircle2 size={18} /> :
                 <Info size={18} />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-sm font-bold text-primary truncate">
                    {toastNotification.title}
                  </h4>
                  <span className="text-[10px] text-accent font-semibold flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    <Bell size={10} />
                    {language === 'bn' ? 'বিজ্ঞপ্তি' : 'View'}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                  {toastNotification.message}
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkRead(toastNotification.id);
                  setToastNotification(null);
                }} 
                className="p-1 rounded-lg text-faint hover:text-primary hover:bg-glass transition-colors shrink-0"
                aria-label="Dismiss toast"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}

          {firestoreError && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-sky-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20"
            >
              <AlertCircle size={20} />
              <span className="text-sm font-bold">{firestoreError}</span>
              <button onClick={() => setFirestoreError(null)} className="ml-2 opacity-50 hover:opacity-100">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex justify-between items-center mb-8 sm:mb-12 animate-in">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-primary">
              {language === 'en' ? 'Hello,' : 'হ্যালো,'} <span className="text-accent">{getLocalizedName(userDisplayName || 'User', language)}</span>
            </h1>
            <p className="text-muted text-sm">{language === 'en' ? `Your ${currency} portfolio at a glance.` : `এক নজরে আপনার ${currency} পোর্টফোলিও।`}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              id="header-notification-bell"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-3 glass rounded-2xl text-muted hover:text-accent hover:border-accent/30 transition-all active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={20} className={notifications.some(n => !n.read) ? "text-accent" : ""} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-deep)]">
                  {notifications.filter(n => !n.read).length > 9 
                    ? '9+' 
                    : (language === 'bn' ? toBanglaNumerals(String(notifications.filter(n => !n.read).length)) : notifications.filter(n => !n.read).length)}
                </span>
              )}
            </button>
            <div id="header-balance-info" className="flex flex-col items-end group">
              <div className="flex items-center gap-1.5 mb-1.5 mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.18em] text-accent font-bold">
                  {timeFilter === 'all' 
                    ? (language === 'en' ? 'Total' : 'মোট') 
                    : timeFilter === 'monthly' 
                      ? new Date(selectedYear, selectedMonth).toLocaleString(language === 'bn' ? 'bn-BD' : 'default', { month: 'short' }) 
                      : timeFilter === 'weekly' 
                        ? (language === 'en' ? `Week ${selectedWeek}` : `${formatNumber(selectedWeek, language)} তম সপ্তাহ`)
                        : formatNumber(selectedYear, language, { useGrouping: false })
                  } {language === 'en' ? 'Balance' : 'ব্যালেন্স'}
                </p>
              </div>
              <div className="relative">
                <div className="px-5 py-2.5 rounded-2xl bg-glass/80 border border-glass-border/70 hover:border-accent/40 shadow-[0_4px_24px_rgba(0,0,0,0.18)] flex items-center gap-3 backdrop-blur-2xl transition-all group-hover:-translate-y-0.5">
                  <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shadow-sm">
                    <Wallet size={15} />
                  </div>
                  <div className="font-extrabold text-primary text-base sm:text-lg tracking-tight tabular-nums">
                    {(() => {
                      const bal = filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
                      return `${bal < 0 ? '-' : ''}${currency}${formatNumber(Math.abs(bal), language)}`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <NotificationCentre 
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDelete={handleDeleteNotification}
          onClearAll={handleClearAllNotifications}
          language={language}
        />

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => setActiveTab('settings')}
                      className="w-12 h-12 rounded-2xl overflow-hidden border border-glass-border bg-glass/50 flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors"
                      title={language === 'en' ? 'Settings & Profile' : 'সেটিংস ও প্রোফাইল'}
                    >
                      {userPhotoURL ? (
                        <img src={userPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={24} className="text-faint" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
                        {language === 'en' ? 'Financial Overview' : 'আর্থিক বিবরণী'}
                      </h2>
                      <p className="text-muted text-xs sm:text-sm">
                        {language === 'en' ? 'Welcome back, ' : 'স্বাগতম, '}
                        {getLocalizedName(userDisplayName || 'User', language)}!
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div id="dashboard-filter-controls">
                      <FilterControls />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <SummaryCard 
                    id="sum-card-income"
                    title={t.totalIncome} 
                    amount={filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)}
                    icon={<TrendingUp className="text-income" />}
                    color="income"
                    timeFilter={timeFilter}
                    currency={currency}
                    language={language}
                  />
                  <SummaryCard 
                    id="sum-card-expense"
                    title={t.totalExpense} 
                    amount={filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)}
                    icon={<TrendingDown className="text-expense" />}
                    color="expense"
                    timeFilter={timeFilter}
                    currency={currency}
                    language={language}
                  />
                  <SummaryCard 
                    id="sum-card-carryover"
                    title={language === 'en' ? 'Carried Savings' : 'পূর্ববর্তী সঞ্চয়'} 
                    amount={previousBalance}
                    icon={<History className="text-sky-400" />}
                    color="primary"
                    timeFilter="Prior"
                    currency={currency}
                    language={language}
                  />
                  <SummaryCard 
                    id="sum-card-savings"
                    title={t.totalBalance} 
                    amount={filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0)}
                    icon={<Scale className="text-primary" size={20} />}
                    color="primary"
                    timeFilter={timeFilter}
                    currency={currency}
                    highlighted={true}
                    language={language}
                  />
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-glass-border">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-bold">
                      {language === 'en' ? 'Recent Activity' : 'সাম্প্রতিক লেনদেন'}
                    </h3>
                    <p className="text-xs text-muted">
                      {language === 'en' 
                        ? `Showing ${timeFilter} transactions` 
                        : `${timeFilter === 'monthly' ? 'মাসিক' : timeFilter === 'weekly' ? 'সাপ্তাহিক' : timeFilter === 'yearly' ? 'বার্ষিক' : 'সব'} লেনদেন দেখাচ্ছে`}
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="text-xs text-accent hover:text-accent/80 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    {t.viewAll} <ChevronRight size={14} />
                  </button>
                </div>
                <TransactionList 
                  transactions={filteredTransactions.slice(0, 5)} 
                  onDelete={deleteTransaction} 
                  onEdit={(t) => setEditingTransaction(t)}
                  compact 
                  currency={currency}
                  allTransactions={transactions}
                  language={language}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div 
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {language === 'en' ? 'Add Transaction' : 'নতুন লেনদেন'}
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    {language === 'en' 
                      ? 'Quickly log your day-to-day income or expense transactions.' 
                      : 'আপনার প্রাত্যহিক আয় বা ব্যয়ের হিসাব দ্রুত সংরক্ষণ করুন।'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <FilterControls />
                </div>
              </div>

              <div className="glass-card">
                <TransactionForm 
                  onAdd={(t) => {
                    addTransaction(t);
                    setActiveTab('overview');
                  }} 
                  transactions={transactions}
                  currency={currency}
                  previousBalance={previousBalance}
                  language={language}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card min-h-[500px] pb-24 md:pb-8"
            >
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">{t.transactionHistory}</h2>
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <FilterControls />
                  </div>
                </div>

                <div id="history-search-controls" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative sm:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
                    <input 
                      type="text"
                      placeholder={language === 'en' ? 'Search transactions, categories...' : 'লেনদেন ও ক্যাটাগরি খুঁজুন...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-glass border border-glass-border rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all text-primary placeholder:text-faint"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-faint hover:text-accent"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-glass border border-glass-border rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all appearance-none text-primary"
                    >
                      <option value="all" className="bg-bg-deep italic">{language === 'en' ? 'All Categories' : 'সকল ক্যাটাগরি'}</option>
                      {Object.keys(CATEGORIES).map(cat => (
                        <option key={cat} value={cat} className="bg-bg-deep">{getTranslatedCategory(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
                      className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all appearance-none text-primary"
                    >
                      <option value="all" className="bg-bg-deep">{language === 'en' ? 'All Types' : 'সব ধরন'}</option>
                      <option value="income" className="bg-bg-deep">{language === 'en' ? 'Income Only (+)' : 'শুধু আয় (+)'}</option>
                      <option value="expense" className="bg-bg-deep">{language === 'en' ? 'Expense Only (-)' : 'শুধু ব্যয় (-)'}</option>
                    </select>
                  </div>
                </div>
              </div>
              <TransactionList 
                transactions={filteredTransactions} 
                onDelete={deleteTransaction} 
                onEdit={(t) => setEditingTransaction(t)}
                currency={currency}
                allTransactions={transactions}
                language={language}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-24 md:pb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                  <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 mb-3">
                    <TrendingUp size={24} className="text-accent" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-accent font-black mb-2 opacity-80">
                    {language === 'en' ? 'Top Expense' : 'সর্বোচ্চ ব্যয়'}
                  </p>
                  <p className="text-2xl font-black tracking-tight">
                    {filteredTransactions.filter(t => t.type === 'expense').length > 0 
                      ? getTranslatedCategory(filteredTransactions.filter(t => t.type === 'expense').sort((a,b) => b.amount - a.amount)[0].category) 
                      : 'N/A'}
                  </p>
                </div>
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                  <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 mb-3">
                    <DollarSign size={24} className="text-accent" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-accent font-black mb-2 opacity-80">
                    {language === 'en' ? 'Avg. Daily' : 'গড় দৈনিক'}
                  </p>
                  <p className="text-2xl font-black tracking-tight">
                    {currency}{formatNumber(filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) / (timeFilter === 'monthly' ? 30 : timeFilter === 'weekly' ? 7 : 30), language, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                  <div className="p-3 rounded-2xl bg-accent/10 text-accent border border-accent/20">
                    <AlertCircle size={24} className="text-sky-400" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-sky-400/80 font-black mb-2 opacity-80">{t.periodNet}</p>
                  <p className="text-2xl font-black tracking-tight">
                    {currency}{formatNumber(filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) - filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), language)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div id="analytics-trend-chart" className="glass-card h-[450px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp size={20} className="text-accent" />
                      {trendPeriod === '7days' 
                        ? (language === 'en' ? 'Recent Trend' : 'সাম্প্রতিক গতিধারা') 
                        : (language === 'en' ? 'Monthly Comparison' : 'মাসিক তুলনা')}
                    </h3>
                    <div className="flex bg-accent/5 p-1 rounded-xl self-start sm:self-auto border border-accent/20">
                      <button 
                        onClick={() => setTrendPeriod('7days')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          trendPeriod === '7days' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:text-primary"
                        )}
                      >
                        {language === 'en' ? '7 Days' : '৭ দিন'}
                      </button>
                      <button 
                        onClick={() => setTrendPeriod('monthComparison')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          trendPeriod === 'monthComparison' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:text-primary"
                        )}
                      >
                        {language === 'en' ? 'Vs Last Month' : 'গত মাসের তুলনা'}
                      </button>
                    </div>
                  </div>
                  <div className="h-[330px] w-full">
                    {trendPeriod === '7days' ? (
                      <TrendChart transactions={filteredTransactions} currency={currency} language={language} />
                    ) : (
                      <MonthlyComparisonChart transactions={filteredTransactions} currency={currency} language={language} />
                    )}
                  </div>
                </div>
                
                <div className="glass-card h-[450px]">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <PieChartIcon size={20} className="text-accent" />
                    {language === 'en' ? 'Expense Distribution' : 'ব্যয়ের অনুপাত'}
                  </h3>
                  <div className="h-[350px] w-full">
                    <CategoryChart transactions={filteredTransactions} currency={currency} language={language} />
                  </div>
                </div>
              </div>

              <div className="glass-card h-[450px]">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-accent" />
                  {language === 'en' ? 'Category Comparison' : 'ক্যাটাগরিভিত্তিক তুলনা'}
                </h3>
                <div className="h-[350px] w-full">
                  <ComparisonBarChart transactions={filteredTransactions} currency={currency} language={language} />
                </div>
              </div>

              <div className="glass-card">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <RefreshCcw size={20} className="text-accent" />
                  {language === 'en' ? 'Month-over-Month Comparison' : 'মাস-ভিত্তিক তুলনা'}
                </h3>
                <ComparisonSummary transactions={filteredTransactions} currency={currency} language={language} />
              </div>
            </motion.div>
          )}

              {activeTab === 'budget' && (
                <motion.div 
                  key="budget"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">
                        {language === 'en' ? 'Budget Goals' : 'বাজেট ও সঞ্চয়'}
                      </h3>
                      <p className="text-xs text-muted mt-1">
                        {language === 'en' 
                          ? 'Track monthly budget limits and stay on top of your financial health.' 
                          : 'মাসিক ব্যয়ের সীমা নির্ধারণ করুন এবং আপনার আর্থিক অবস্থা নিয়ন্ত্রণে রাখুন।'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <FilterControls />
                    </div>
                  </div>

                  <BudgetCard 
                    budget={budget} 
                    setBudget={updateBudget} 
                    transactions={filteredTransactions} 
                    currency={currency} 
                    previousBalance={previousBalance}
                    theme={theme}
                    language={language}
                  />
              
                  <div className="mt-8 glass-card">
                    <h4 className="text-lg font-semibold mb-4 text-primary">
                      {language === 'en' ? 'Budgeting Tips' : 'বাজেট সংক্রান্ত পরামর্শ'}
                    </h4>
                    <ul className="space-y-4 text-sm text-muted">
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        {language === 'en' 
                          ? 'Set realistic monthly limits based on your average Bazar and Rent costs.' 
                          : 'আপনার বাজার এবং বাড়ি ভাড়ার খরচের ওপর ভিত্তি করে যুক্তিসঙ্গত মাসিক বাজেট নির্ধারণ করুন।'}
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        {language === 'en' 
                          ? 'Always track small expenses like Rickshaw/CNG to avoid "financial leaks".' 
                          : 'আর্থিক অপচয় এড়াতে সবসময় রিকশা/সিএনজির মতো ছোট ছোট ব্যয়গুলো ট্র্যাক করুন।'}
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        {language === 'en' 
                          ? 'Aim to save at least 20% of your income for long-term financial growth.' 
                          : 'দীর্ঘমেয়াদী আর্থিক উন্নতির জন্য আপনার আয়ের অন্তত ২০% সঞ্চয় করার চেষ্টা করুন।'}
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

          {activeTab === 'tools' && (
            <motion.div 
              key="tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 pb-24 md:pb-8"
            >
              {activeTool === null ? (
                <>
                  {/* Page Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
                        <Wrench className="text-accent" size={28} />
                        <span>{language === 'en' ? 'Tools & Features' : 'টুলস ও সুবিধাসমূহ'}</span>
                      </h2>
                    </div>
                  </div>

                  {/* Section 1: Financial Utilities & Calculators */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                      {language === 'en' ? 'Financial Utilities & Calculators' : 'আর্থিক ইউটিলিটি ও ক্যালকুলেটর'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {/* Nearby Currency Exchange */}
                      <button
                        type="button"
                        onClick={() => setActiveTool('nearby_exchange')}
                        className="w-full glass-card p-5 rounded-2xl border border-glass-border hover:border-amber-500/40 bg-glass/60 hover:bg-glass transition-all flex items-center justify-between gap-4 text-left group cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                            <Coins size={22} />
                          </div>
                          <span className="font-bold text-base text-primary group-hover:text-accent transition-colors truncate">
                            {language === 'en' ? 'Nearby Currency Exchange' : 'নিকটস্থ মুদ্রা বিনিময় কেন্দ্র'}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>

                      {/* Monthly Fixed Costs */}
                      <button
                        type="button"
                        onClick={() => setActiveTool('fixed_costs')}
                        className="w-full glass-card p-5 rounded-2xl border border-glass-border hover:border-accent/40 bg-glass/60 hover:bg-glass transition-all flex items-center justify-between gap-4 text-left group cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent group-hover:scale-105 transition-transform shrink-0">
                            <Repeat size={22} />
                          </div>
                          <span className="font-bold text-base text-primary group-hover:text-accent transition-colors truncate">
                            {language === 'en' ? 'Monthly Fixed Costs' : 'মাসিক নির্দিষ্ট খরচ'}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>

                      {/* Yearly Tax Calculator */}
                      <button
                        type="button"
                        onClick={() => setActiveTool('tax_calculator')}
                        className="w-full glass-card p-5 rounded-2xl border border-glass-border hover:border-emerald-500/40 bg-glass/60 hover:bg-glass transition-all flex items-center justify-between gap-4 text-left group cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                            <Calculator size={22} />
                          </div>
                          <span className="font-bold text-base text-primary group-hover:text-accent transition-colors truncate">
                            {language === 'en' ? 'Yearly Tax Calculator' : 'বার্ষিক আয়কর ক্যালকুলেটর'}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Preferences & Customization */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                      {language === 'en' ? 'Preferences & Customization' : 'পছন্দ ও কাস্টমাইজেশন'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {/* Preferred Currency */}
                      <button
                        type="button"
                        onClick={() => setActiveTool('currency')}
                        className="w-full glass-card p-5 rounded-2xl border border-glass-border hover:border-accent/40 bg-glass/60 hover:bg-glass transition-all flex items-center justify-between gap-4 text-left group cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent group-hover:scale-105 transition-transform shrink-0">
                            <Wallet size={22} />
                          </div>
                          <span className="font-bold text-base text-primary group-hover:text-accent transition-colors truncate">
                            {language === 'en' ? 'Preferred Currency' : 'পছন্দসই কারেন্সি'}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>

                      {/* Restart Feature Tour */}
                      <button
                        type="button"
                        onClick={() => setActiveTool('tour')}
                        className="w-full glass-card p-5 rounded-2xl border border-glass-border hover:border-accent/40 bg-glass/60 hover:bg-glass transition-all flex items-center justify-between gap-4 text-left group cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent group-hover:scale-105 transition-transform shrink-0">
                            <Rocket size={22} />
                          </div>
                          <span className="font-bold text-base text-primary group-hover:text-accent transition-colors truncate">
                            {language === 'en' ? 'Restart Feature Tour' : 'ফিচার ট্যুর পুনরায় শুরু করুন'}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Section 3: Data Management */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                      {language === 'en' ? 'Data Management' : 'ডেটা ব্যবস্থাপনা'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {/* Export Data */}
                      <button
                        type="button"
                        onClick={() => setActiveTool('export')}
                        className="w-full glass-card p-5 rounded-2xl border border-glass-border hover:border-blue-500/40 bg-glass/60 hover:bg-glass transition-all flex items-center justify-between gap-4 text-left group cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                            <Download size={22} />
                          </div>
                          <span className="font-bold text-base text-primary group-hover:text-blue-400 transition-colors truncate">
                            {language === 'en' ? 'Export Data' : 'ডেটা এক্সপোর্ট করুন'}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-muted group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Dedicated Page Views */
                <div className="space-y-6 animate-in">
                  {/* Dedicated Page Header with Back button */}
                  <div className="flex items-center justify-between gap-4 pb-2 border-b border-glass-border/40">
                    <button
                      type="button"
                      onClick={() => setActiveTool(null)}
                      className="px-3.5 py-2 glass rounded-xl text-xs font-bold text-primary hover:text-accent hover:border-accent/40 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <ChevronLeft size={16} />
                      <span>{language === 'en' ? 'Back to Tools' : 'টুলসে ফিরে যান'}</span>
                    </button>
                  </div>

                  {/* 1. Dedicated Page: Nearby Currency Exchange */}
                  {activeTool === 'nearby_exchange' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                          <Coins size={22} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                            {language === 'en' ? 'Nearby Currency Exchange' : 'নিকটস্থ মুদ্রা বিনিময় কেন্দ্র'}
                          </h3>
                          <p className="text-xs text-muted">
                            {language === 'en' 
                              ? 'Locate authorized money changers, bank exchange booths, compare rates, and get turn-by-turn directions.' 
                              : 'অনুমোদিত মানি এক্সচেঞ্জ ও ব্যাংক বুথ খুঁজুন, লাইভ রেট তুলনা করুন এবং সরাসরি দিকনির্দেশনা পান।'}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card rounded-3xl border border-glass-border p-2 sm:p-4 overflow-hidden">
                        <NearbyCurrencyExchange
                          language={language}
                          currency={currency}
                          isFullscreen={isNearbyExchangeFullscreen}
                          onToggleFullscreen={(val) => setIsNearbyExchangeFullscreen(val)}
                          onAddTransaction={(tx) => {
                            addTransaction(tx);
                            setActiveTool(null);
                          }}
                          onClose={() => setActiveTool(null)}
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Dedicated Page: Monthly Fixed Costs */}
                  {activeTool === 'fixed_costs' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                          <Repeat size={22} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                            {language === 'en' ? 'Monthly Fixed Costs' : 'মাসিক নির্দিষ্ট খরচ'}
                          </h3>
                          <p className="text-xs text-muted">
                            {language === 'en' 
                              ? 'Predefine your recurring monthly commitments (Rent, Utilities, Tuition) and apply them to transactions in one tap.' 
                              : 'আপনার নিয়মিত মাসিক খরচগুলো (বাড়িভাড়া, ইউটিলিটি বিল, ইত্যাদি) সংরক্ষণ করুন এবং এক ক্লিকে যুক্ত করুন।'}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-glass-border">
                        <FixedCostManager
                          transactions={transactions}
                          onApplyFixedCosts={handleApplyFixedCosts}
                          onDeleteTransaction={deleteTransaction}
                          currency={currency}
                          language={language}
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. Dedicated Page: Yearly Tax Calculator */}
                  {activeTool === 'tax_calculator' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                          <Calculator size={22} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                            {language === 'en' ? 'Yearly Tax Calculator' : 'বার্ষিক আয়কর ক্যালকুলেটর'}
                          </h3>
                          <p className="text-xs text-muted">
                            {language === 'en' 
                              ? 'Interactive Bangladesh income tax slabs, rebates, and estimated net tax breakdown based on annual income.' 
                              : 'বাংলাদেশের আয়কর স্ল্যাব, রেয়াত এবং আপনার বার্ষিক লেনদেনের ওপর ভিত্তি করে আনুমানিক প্রদেয় কর হিসাব করুন।'}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-glass-border">
                        <YearlyTaxCalculator 
                          transactions={transactions}
                          currency={currency}
                          language={language}
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. Dedicated Page: Preferred Currency */}
                  {activeTool === 'currency' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                          <Wallet size={22} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                            {language === 'en' ? 'Preferred Currency' : 'পছন্দসই কারেন্সি'}
                          </h3>
                          <p className="text-xs text-muted">
                            {language === 'en' 
                              ? 'Choose the currency symbol displayed across balances, transactions, and reports.' 
                              : 'ব্যালেন্স, লেনদেন ও চার্ট জুড়ে প্রদর্শিত মুদ্রার প্রতীক নির্বাচন করুন।'}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card p-5 sm:p-8 rounded-3xl border border-glass-border space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                          {[
                            { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka', labelBn: 'বাংলাদেশী টাকা' },
                            { code: 'USD', symbol: '$', label: 'US Dollar', labelBn: 'মার্কিন ডলার' },
                            { code: 'EUR', symbol: '€', label: 'Euro', labelBn: 'ইউরো' },
                            { code: 'GBP', symbol: '£', label: 'British Pound', labelBn: 'ব্রিটিশ পাউন্ড' },
                            { code: 'JPY', symbol: '¥', label: 'Japanese Yen', labelBn: 'জাপানি ইয়েন' },
                            { code: 'INR', symbol: '₹', label: 'Indian Rupee', labelBn: 'ভারতীয় রুপি' },
                          ].map((curr) => {
                            const isSelected = currency === curr.symbol;
                            return (
                              <button
                                key={curr.code}
                                type="button"
                                onClick={() => setCurrency(curr.symbol)}
                                className={cn(
                                  "p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer",
                                  isSelected
                                    ? "bg-accent/15 border-accent text-primary shadow-lg shadow-accent/10"
                                    : "glass border-glass-border hover:border-accent/40 text-muted hover:text-primary"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-black text-accent">{curr.symbol}</span>
                                  {isSelected && <Check size={18} className="text-accent" />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-primary">{curr.code}</p>
                                  <p className="text-[10px] text-muted">{language === 'en' ? curr.label : curr.labelBn}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="p-4 rounded-2xl bg-glass border border-glass-border/60 flex items-center justify-between">
                          <span className="text-xs text-muted">{language === 'en' ? 'Sample Display' : 'নমুনা প্রদর্শন'}:</span>
                          <span className="text-lg font-black text-primary tabular-nums">{currency}25,000.00</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Dedicated Page: Restart Feature Tour */}
                  {activeTool === 'tour' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                          <Rocket size={22} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                            {language === 'en' ? 'Restart Feature Tour' : 'ফিচার ট্যুর পুনরায় শুরু করুন'}
                          </h3>
                          <p className="text-xs text-muted">
                            {language === 'en' 
                              ? 'Relaunch the interactive guided onboarding guide to explore core capabilities.' 
                              : 'অ্যাপের প্রধান ফিচারগুলো পরখ করতে নির্দেশনামূলক ট্যুরটি চালু করুন।'}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-glass-border text-center space-y-6">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 mx-auto flex items-center justify-center text-accent shadow-lg shadow-accent/10">
                            <Rocket size={32} />
                          </div>
                          <h4 className="text-lg font-bold text-primary">
                            {language === 'en' ? 'Explore Digital Hishab' : 'ডিজিটাল হিসাব পরখ করুন'}
                          </h4>
                          <p className="text-xs text-muted leading-relaxed">
                            {language === 'en'
                              ? 'The feature tour highlights key sections: adding income and expenses, audit-ready history, visual intelligence, budgeting alerts, and tools.'
                              : 'ফিচার ট্যুরটি আপনাকে ড্যাশবোর্ড, আয়-ব্যয় সংযুক্তি, ইতিহাস, গ্রাফিকাল বিশ্লেষণ এবং বাজেটের নিয়মাবলী ধাপে ধাপে বুঝিয়ে দেবে।'}
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setShowOnboarding(true)}
                            className="px-6 py-3 bg-accent hover:brightness-110 text-white rounded-2xl text-sm font-bold shadow-lg shadow-accent/20 transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
                          >
                            <Rocket size={18} />
                            <span>{language === 'en' ? 'Launch Guided Tour Now' : 'ট্যুর এখন শুরু করুন'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. Dedicated Page: Export Data */}
                  {activeTool === 'export' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                          <Download size={22} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                            {language === 'en' ? 'Export Data' : 'ডেটা এক্সপোর্ট করুন'}
                          </h3>
                          <p className="text-xs text-muted">
                            {language === 'en' 
                              ? 'Download complete transaction history in spreadsheet, audit PDF, or CSV format.' 
                              : 'আপনার যাবতীয় লেনদেনের বিবরণ স্প্রেডশীট, নিরীক্ষাযোগ্য পিডিএফ বা সিএসভি ফরম্যাটে ডাউনলোড করুন।'}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-glass-border space-y-6">
                        <div className="p-4 rounded-2xl bg-glass border border-glass-border/60 flex items-center justify-between">
                          <span className="text-xs text-muted">{language === 'en' ? 'Total Records to Export' : 'মোট রেকর্ড সংখ্যা'}:</span>
                          <span className="text-sm font-bold text-primary">{transactions.length} {language === 'en' ? 'transactions' : 'টি লেনদেন'}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* CSV */}
                          <div className="p-5 glass rounded-2xl border border-glass-border flex flex-col justify-between gap-4">
                            <div>
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                                <FileText size={20} />
                              </div>
                              <h4 className="text-sm font-bold text-primary">CSV File</h4>
                              <p className="text-[11px] text-muted mt-1">
                                {language === 'en' ? 'Standard comma-separated format for generic software.' : 'যেকোনো সফটওয়্যারে ব্যবহারের জন্য সাধারণ সিএসভি ফরম্যাট।'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={exportToCSV}
                              disabled={isExportingCSV}
                              className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-glass-border flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isExportingCSV ? (
                                <span className="animate-spin inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full" />
                              ) : <FileText size={15} />}
                              <span>{isExportingCSV ? 'CSV...' : 'Download CSV'}</span>
                            </button>
                          </div>

                          {/* PDF */}
                          <div className="p-5 glass rounded-2xl border border-glass-border flex flex-col justify-between gap-4">
                            <div>
                              <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 mb-3">
                                <Download size={20} />
                              </div>
                              <h4 className="text-sm font-bold text-primary">PDF Statement</h4>
                              <p className="text-[11px] text-muted mt-1">
                                {language === 'en' ? 'Formatted audit document with Bengali font support.' : 'বাংলা ফন্ট ও স্বাক্ষর ঘরসহ সুসজ্জিত নিরীক্ষা রিপোর্ট।'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={exportToPDF}
                              disabled={isExportingPDF}
                              className="w-full py-2.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isExportingPDF ? (
                                <span className="animate-spin inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full" />
                              ) : <Download size={15} />}
                              <span>{isExportingPDF ? (language === 'bn' ? 'তৈরি...' : 'PDF...') : 'Download PDF'}</span>
                            </button>
                          </div>

                          {/* Excel */}
                          <div className="p-5 glass rounded-2xl border border-glass-border flex flex-col justify-between gap-4">
                            <div>
                              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent mb-3">
                                <FileText size={20} />
                              </div>
                              <h4 className="text-sm font-bold text-primary">Excel (.xlsx)</h4>
                              <p className="text-[11px] text-muted mt-1">
                                {language === 'en' ? 'Multi-column formatted Microsoft Excel spreadsheet.' : 'মাইক্রোসফট এক্সেলে সহজে বিশ্লেষণের জন্য স্প্রেডশীট।'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={exportToExcel}
                              disabled={isExportingExcel}
                              className="w-full py-2.5 bg-accent/15 hover:bg-accent/25 text-accent rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isExportingExcel ? (
                                <span className="animate-spin inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full" />
                              ) : <FileText size={15} />}
                              <span>{isExportingExcel ? (language === 'bn' ? 'তৈরি...' : 'EXCEL...') : 'Download Excel'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {(activeTab === 'settings' || activeTab === 'user') && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 pb-24 md:pb-8"
            >
              {/* Page Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
                    <Settings className="text-accent" size={28} />
                    <span>{language === 'en' ? 'Settings & Profile' : 'সেটিংস ও প্রোফাইল'}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted mt-1">
                    {language === 'en'
                      ? 'Manage your account profile, security credentials, and application preferences.'
                      : 'আপনার অ্যাকাউন্ট প্রোফাইল, নিরাপত্তা এবং অ্যাপ্লিকেশন সেটিংস পরিচালনা করুন।'}
                  </p>
                </div>
              </div>

              {/* Merged Profile Card */}
              <div className="glass-card text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border border-accent/20 relative group bg-glass flex items-center justify-center shadow-lg shadow-accent/5">
                  {userPhotoURL ? (
                    <img src={userPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} className="text-accent" />
                  )}
                  <div 
                    onClick={() => {
                      setProfileModalType('name');
                      setIsProfileModalOpen(true);
                    }}
                    className="absolute inset-0 bg-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    title={language === 'en' ? 'Change Photo & Name' : 'ছবি ও নাম পরিবর্তন করুন'}
                  >
                    <Settings size={20} className="text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{getLocalizedName(userDisplayName || userEmail.split('@')[0], language)}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium border border-accent/20 mb-8">
                  <ShieldCheck size={14} /> {language === 'en' ? 'Verified Account' : 'যাচাইকৃত অ্যাকাউন্ট'}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
                  <div className="p-4 glass rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-faint font-bold mb-1">{language === 'en' ? 'Email Address' : 'ইমেইল ঠিকানা'}</p>
                    <p className="text-sm font-medium">{userEmail}</p>
                  </div>
                  <div className="p-4 glass rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-faint font-bold mb-1">{language === 'en' ? 'Gender' : 'লিঙ্গ'}</p>
                    <p className="text-sm font-medium">
                      {userGender === 'Male' 
                        ? (language === 'en' ? 'Male' : 'পুরুষ') 
                        : userGender === 'Female' 
                        ? (language === 'en' ? 'Female' : 'নারী') 
                        : userGender === 'Other' 
                        ? (language === 'en' ? 'Other' : 'অন্যান্য') 
                        : (language === 'en' ? 'Not Set' : 'নির্ধারিত নয়')}
                    </p>
                  </div>
                  <div className="p-4 glass rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-faint font-bold mb-1">{language === 'en' ? 'Member Since' : 'সদস্যপদ গ্রহণের তারিখ'}</p>
                    <p className="text-sm font-medium">
                      {registrationDate ? new Date(registrationDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric', day: 'numeric' }) : (language === 'en' ? 'April 2026' : 'এপ্রিল ২০২৬')}
                    </p>
                  </div>
                  <div className="p-4 glass rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-faint font-bold mb-1">{language === 'en' ? 'Account Type' : 'অ্যাকাউন্টের ধরন'}</p>
                    <p className="text-sm font-medium">{language === 'en' ? 'Personal Finance Pro' : 'ব্যক্তিগত অর্থ প্রো'}</p>
                  </div>
                  <div className="p-4 glass rounded-2xl md:col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-faint font-bold mb-1">{language === 'en' ? 'Security Status' : 'নিরাপত্তা স্থিতি'}</p>
                    <p className="text-sm font-medium text-accent">{language === 'en' ? 'Bank-Grade Active' : 'ব্যাংক-গ্রেড সক্রিয়'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setProfileModalType('name');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full py-3 glass rounded-xl text-sm font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <User size={16} /> {language === 'en' ? 'Update Profile Info' : 'প্রোফাইল তথ্য আপডেট করুন'}
                  </button>
                  <button 
                    onClick={() => {
                      setProfileModalType('password');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full py-3 glass rounded-xl text-sm font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck size={16} /> {language === 'en' ? 'Change Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                  </button>
                  <button 
                    onClick={() => {
                      setConfirmAction({
                        title: language === 'en' ? "Delete Account" : "অ্যাকাউন্ট মুছে ফেলুন",
                        message: language === 'en' 
                          ? "CRITICAL: Are you sure you want to delete your account? All your transaction data will be permanently erased. This action cannot be undone." 
                          : "গুরুতর সতর্কতা: আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্টটি মুছে ফেলতে চান? আপনার সকল লেনদেনের তথ্য চিরতরে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা সম্ভব নয়।",
                        isDanger: true,
                        onConfirm: async () => {
                          if (!auth.currentUser) return;
                          try {
                            const q = query(collection(db, 'transactions'), where('userId', '==', auth.currentUser.uid));
                            const snapshot = await getDocs(q);
                            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                            await Promise.all(deletePromises);
                            
                            await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                            await deleteUser(auth.currentUser);
                            
                            handleLogout();
                          } catch (error: any) {
                            console.error("Delete Account Error:", error);
                            if (error.code === 'auth/requires-recent-login') {
                              alert(language === 'en' ? "Please log out and log in again to perform this sensitive action." : "অনুগ্রহ করে লগ আউট করুন এবং এই সংবেদনশীল কাজটি সম্পন্ন করতে আবার লগ ইন করুন।");
                            }
                          }
                        }
                      });
                      setIsConfirmModalOpen(true);
                    }}
                    className="w-full py-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl text-sm font-bold hover:bg-sky-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={16} /> {language === 'en' ? 'Delete Account' : 'অ্যাকাউন্ট মুছে ফেলুন'}
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="w-full py-3 glass rounded-xl text-sm font-bold text-muted hover:text-primary hover:bg-accent/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut size={16} /> {t.signOut}
                  </button>
                </div>
              </div>

              {/* App Preferences & System Section */}
              <div className="glass-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-accent" />
                  {t.appSettings}
                </h3>
                
                <div className="space-y-4">
                  {/* UI Theme Mode Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 glass rounded-2xl gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                        {theme === 'dark' ? <Moon size={20} className="text-accent" /> : <Sun size={20} className="text-accent" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{t.theme}</p>
                        <p className="text-[10px] text-muted">
                          {theme === 'dark' ? t.themeDark : t.themeLight}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto" id="theme-change-buttons">
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== 'dark') toggleTheme();
                        }}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5",
                          theme === 'dark'
                            ? "bg-accent text-white shadow-lg shadow-accent/20"
                            : "bg-accent/10 hover:bg-accent/20 text-accent"
                        )}
                      >
                        <Moon size={14} />
                        <span>{t.themeDark}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== 'light') toggleTheme();
                        }}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5",
                          theme === 'light'
                            ? "bg-accent text-white shadow-lg shadow-accent/20"
                            : "bg-accent/10 hover:bg-accent/20 text-accent"
                        )}
                      >
                        <Sun size={14} />
                        <span>{t.themeLight}</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Selection Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 glass rounded-2xl gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                        <Globe size={20} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{t.appLanguage}</p>
                        <p className="text-[10px] text-muted">{t.languageSelect}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto" id="language-change-buttons">
                      <button
                        onClick={() => changeLanguage('en')}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer",
                          language === 'en'
                            ? "bg-accent text-white shadow-lg shadow-accent/20"
                            : "bg-accent/10 hover:bg-accent/20 text-accent"
                        )}
                      >
                        English
                      </button>
                      <button
                        onClick={() => changeLanguage('bn')}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer",
                          language === 'bn'
                            ? "bg-accent text-white shadow-lg shadow-accent/20"
                            : "bg-accent/10 hover:bg-accent/20 text-accent"
                        )}
                      >
                        বাংলা
                      </button>
                    </div>
                  </div>

                  {/* Reset All Data */}
                  <div className="flex items-center justify-between p-4 glass rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
                        <RefreshCcw size={20} className="text-sky-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{language === 'en' ? 'Reset All Data' : 'সকল ডেটা রিসেট করুন'}</p>
                        <p className="text-[10px] text-faint">
                          {language === 'en' ? 'Permanently clear all transactions' : 'স্থায়ীভাবে সকল লেনদেন মুছে ফেলুন'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setConfirmAction({
                          title: language === 'en' ? "Reset All Data" : "সকল ডেটা রিসেট করুন",
                          message: language === 'en' ? "Are you sure you want to clear all data? This cannot be undone." : "আপনি কি নিশ্চিত যে আপনি সকল ডেটা মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা সম্ভব নয়।",
                          isDanger: true,
                          onConfirm: () => {
                            setTransactions([]);
                            setBudget(0);
                            setNotifications([]);
                            dismissedAlertsRef.current.clear();
                            readAlertsRef.current.clear();
                            localStorage.removeItem('finflow_transactions');
                            localStorage.removeItem('finflow_budget');
                            localStorage.removeItem('finflow_notifications');
                            localStorage.removeItem('finflow_fixed_costs');
                            localStorage.removeItem('finflow_dismissed_alerts');
                            localStorage.removeItem('finflow_read_alerts');
                            if (auth.currentUser) {
                              localStorage.removeItem(`finflow_notifications_${auth.currentUser.uid}`);
                              localStorage.removeItem(`finflow_dismissed_alerts_${auth.currentUser.uid}`);
                              localStorage.removeItem(`finflow_read_alerts_${auth.currentUser.uid}`);
                            }
                            setActiveTab('overview');
                          }
                        });
                        setIsConfirmModalOpen(true);
                      }}
                      className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {language === 'en' ? 'Reset' : 'রিসেট'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 glass rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                        <Info size={20} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{language === 'en' ? 'About Digital Hishab' : 'ডিজিটাল হিসাব সম্পর্কে'}</p>
                        <p className="text-[10px] text-faint">
                          {language === 'en' ? 'Version 1.0.0 • 2026 Edition' : 'ভার্সন ১.০.০ • ২০২৬ সংস্করণ'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProfileModalOpen && (
            <ProfileModal 
              type={profileModalType} 
              onClose={() => setIsProfileModalOpen(false)}
              userEmail={userEmail}
              userDisplayName={userDisplayName}
              setUserDisplayName={setUserDisplayName}
              userPhotoURL={userPhotoURL}
              setUserPhotoURL={setUserPhotoURL}
              userGender={userGender}
              setUserGender={setUserGender}
              language={language}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showOnboarding && (
            <Onboarding 
              onComplete={completeOnboarding} 
              onSkip={completeOnboarding}
              setActiveTab={setActiveTab}
              language={language}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {editingTransaction && (
            <TransactionEditModal 
              transaction={editingTransaction}
              onClose={() => setEditingTransaction(null)}
              onUpdate={updateTransaction}
              transactions={transactions}
              currency={currency}
              previousBalance={previousBalance}
              language={language}
            />
          )}
          {isConfirmModalOpen && confirmAction && (
            <ConfirmModal 
              title={confirmAction.title}
              message={confirmAction.message}
              isDanger={confirmAction.isDanger}
              onConfirm={() => {
                confirmAction.onConfirm();
                setIsConfirmModalOpen(false);
              }}
              onClose={() => setIsConfirmModalOpen(false)}
              language={language}
            />
          )}
        </AnimatePresence>

        {/* Android APK PDF Save / Share Dialog */}
        <AnimatePresence>
          {androidPdfModal && androidPdfModal.isOpen && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="bg-bg-deep border border-glass-border/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Top decorative accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-accent" />
                
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary">
                        {language === 'bn' ? 'অ্যান্ড্রয়েড পিডিএফ প্রস্তুত' : 'Android PDF Ready'}
                      </h3>
                      <p className="text-xs text-muted truncate max-w-[240px]">
                        {androidPdfModal.filename}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAndroidPdfModal(null)}
                    className="p-2 rounded-xl text-faint hover:text-primary hover:bg-glass transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed mb-5">
                  <p className="font-semibold mb-1 flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={15} />
                    {language === 'bn' ? 'রিপোর্ট সফলভাবে তৈরি হয়েছে' : 'Report generated successfully'}
                  </p>
                  <p className="text-[11px] opacity-90">
                    {language === 'bn' 
                      ? 'অ্যান্ড্রয়েড ডিভাইসের ডাউনলোড ফোল্ডারে সেভ করতে বা সরাসরি শেয়ার করতে নিচের অপশন ব্যবহার করুন:' 
                      : 'Save directly to your Android device Downloads folder or open the Android share/save dialog:'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!androidPdfModal) return;
                      // 1. Try Capacitor native Share if file URI exists
                      if (androidPdfModal.fileUri) {
                        try {
                          await Share.share({
                            title: androidPdfModal.filename,
                            text: language === 'bn' ? 'ডিজিটাল হিসাব লেনদেন বিবরণী রিপোর্ট' : 'Digital Hishab Transaction Statement',
                            dialogTitle: language === 'bn' ? 'পিডিএফ ফাইল ওপেন বা সেভ করুন' : 'Open or Save PDF File',
                            files: [androidPdfModal.fileUri],
                          });
                          setAndroidPdfModal(null);
                          return;
                        } catch (err: any) {
                          if (err?.name === 'AbortError' || err?.message?.includes('canceled')) {
                            setAndroidPdfModal(null);
                            return;
                          }
                        }
                      }

                      // 2. Try saveAndSharePdfOnAndroid directly
                      if (androidPdfModal.blob && androidPdfModal.pureBase64) {
                        const res = await saveAndSharePdfOnAndroid(androidPdfModal.blob, androidPdfModal.filename, androidPdfModal.pureBase64);
                        if (res.success) {
                          setAndroidPdfModal(null);
                          return;
                        }
                      }

                      // 3. Try Web Share API with File
                      if (androidPdfModal.file && typeof navigator !== 'undefined' && navigator.canShare) {
                        try {
                          if (navigator.canShare({ files: [androidPdfModal.file] })) {
                            await navigator.share({
                              files: [androidPdfModal.file],
                              title: androidPdfModal.filename,
                              text: language === 'bn' ? 'ডিজিটাল হিসাব লেনদেন বিবরণী রিপোর্ট' : 'Digital Hishab Transaction Statement',
                            });
                            setAndroidPdfModal(null);
                            return;
                          }
                        } catch (err: any) {
                          if (err.name === 'AbortError') {
                            setAndroidPdfModal(null);
                            return;
                          }
                        }
                      }

                      handleAndroidDirectSave();
                    }}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Share2 size={16} />
                    <span>{language === 'bn' ? 'অ্যান্ড্রয়েড সেভ / শেয়ার ডায়ালগ' : 'Open Android Share / Save Dialog'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAndroidDirectSave}
                    className="w-full py-3 px-4 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download size={15} />
                    <span>{language === 'bn' ? 'ডাউনলোড ফোল্ডারে সংরক্ষণ (Downloads)' : 'Save to Downloads Folder'}</span>
                  </button>

                  {androidPdfModal.blob && (
                    <button
                      type="button"
                      onClick={() => {
                        const url = URL.createObjectURL(androidPdfModal.blob!);
                        window.open(url, '_blank');
                      }}
                      className="w-full py-2.5 px-4 bg-glass hover:bg-glass/80 text-muted hover:text-primary border border-glass-border font-medium rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>{language === 'bn' ? 'পিডিএফ প্রিভিউ দেখুন' : 'Preview PDF Document'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-components ---

function LoginView({ onLogin, language = 'en', onLanguageChange }: { onLogin: (e: React.FormEvent) => void; language?: LanguageType; onLanguageChange?: (lang: LanguageType) => void }) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Android Back button when in register or forgot password modes
  useEffect(() => {
    const handleLoginBack = (e: Event) => {
      if (authMode === 'register' || authMode === 'forgot') {
        e.preventDefault();
        setAuthMode('login');
        setError('');
        setSuccess('');
      }
    };
    window.addEventListener('app-back-button', handleLoginBack);
    return () => window.removeEventListener('app-back-button', handleLoginBack);
  }, [authMode]);

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return re.test(email.toLowerCase());
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authMode === 'register') {
      if (!fullName.trim()) {
        setError(language === 'en' ? 'Please enter your full name.' : 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
        return;
      }
      if (fullName.trim().length < 2) {
        setError(language === 'en' ? 'Full name must be at least 2 characters.' : 'পুরো নাম অন্তত ২ অক্ষরের হতে হবে।');
        return;
      }

      if (!dob) {
        setError(language === 'en' ? 'Please enter your date of birth.' : 'অনুগ্রহ করে আপনার জন্ম তারিখ দিন।');
        return;
      }

      const birthDate = new Date(dob);
      const today = new Date();
      if (isNaN(birthDate.getTime())) {
        setError(language === 'en' ? 'Please enter a valid date of birth.' : 'অনুগ্রহ করে একটি সঠিক জন্ম তারিখ দিন।');
        return;
      }
      if (birthDate > today) {
        setError(language === 'en' ? 'Date of birth cannot be in the future.' : 'জন্ম তারিখ ভবিষ্যতের হতে পারে না।');
        return;
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 5) {
        setError(language === 'en' ? 'You must be at least 5 years old.' : 'রেজিস্ট্রেশনের জন্য বয়স অন্তত ৫ বছর হতে হবে।');
        return;
      }
      if (age > 120) {
        setError(language === 'en' ? 'Please enter a realistic date of birth.' : 'অনুগ্রহ করে একটি বাস্তবসম্মত জন্ম তারিখ প্রদান করুন।');
        return;
      }
    }

    if (!validateEmail(email)) {
      setError(language === 'en' ? 'Please enter a valid @gmail.com address.' : 'অনুগ্রহ করে একটি সঠিক @gmail.com এড্রেস লিখুন।');
      return;
    }

    if ((authMode === 'register' || (authMode === 'forgot' && forgotStep === 'reset')) && getPasswordStrength(authMode === 'register' ? password : newPassword) < 3) {
      setError(language === 'en' 
        ? 'Password too weak. Use at least 8 chars, uppercase, numbers, and symbols.'
        : 'পাসওয়ার্ডটি অতি দুর্বল। অন্তত ৮ অক্ষর এবং বড় হাতের অক্ষর, সংখ্যা ও প্রতীকের মিশ্রণ ব্যবহার করুন।');
      return;
    }

    try {
      if (authMode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email,
          displayName: fullName.trim(),
          dob: dob,
          createdAt: serverTimestamp(),
          budget: 0,
          gender: '',
          hasCompletedOnboarding: false,
          language: language
        });

        await updateProfile(user, {
          displayName: fullName.trim()
        });

        setAuthMode('login');
        setSuccess(language === 'en' ? 'Successfully created! Please login.' : 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! অনুগ্রহ করে লগইন করুন।');
        setFullName('');
        setDob('');
        setEmail('');
        setPassword('');
      } else if (authMode === 'login') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          // onAuthStateChanged will handle the rest
        } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
            setError(language === 'en' ? 'Account not registered. Create a new one.' : 'এই অ্যাকাউন্টটি রেজিস্টার করা নেই। একটি নতুন অ্যাকাউন্ট তৈরি করুন।');
          } else if (err.code === 'auth/wrong-password') {
            setError(language === 'en' ? 'Incorrect password. Please try again or reset your password.' : 'ভুল পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন অথবা রিসেট করুন।');
          } else if (err.code === 'auth/invalid-credential') {
            setError(language === 'en' ? 'Invalid credentials. Check your password or try resetting it if you forgot.' : 'ভুল তথ্য প্রদান করা হয়েছে। পাসওয়ার্ড যাচাই করে পুনরায় প্রবেশ করান।');
          } else {
            setError(language === 'en' ? 'Login failed. Please check your credentials or reset your password.' : 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার পাসওয়ার্ড বা ইমেইল যাচাই করুন।');
          }
        }
      } else if (authMode === 'forgot') {
        if (forgotStep === 'email') {
          try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(language === 'en' ? 'Password reset email sent! Please check your inbox.' : 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে! আপনার ইনবক্স চেক করুন।');
          } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
              setError(language === 'en' ? 'User not found. Please register.' : 'ইউজার খুঁজে পাওয়া যায়নি। অনুগ্রহ করে রেজিস্টার করুন।');
            } else {
              setError(language === 'en' ? 'Failed to send reset email.' : 'রিসেট ইমেইল প্রেরণ করা সম্ভব হয়নি।');
            }
          }
        }
      }
    } catch (err: any) {
      const errorCode = err.code || '';
      const errorMessage = err.message || '';
      
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
        setError(language === 'en' 
          ? 'This email is already registered. If you forgot your password, please reset it.'
          : 'এই ইমেইলটি ইতিপূর্বে রেজিস্টার করা হয়েছে। পাসওয়ার্ড ভুলে গেলে রিসেট করুন।');
      } else {
        console.error("Auth Error:", err);
        setError(errorMessage || (language === 'en' ? 'An unexpected error occurred.' : 'একটি আকস্মিক ত্রুটি ঘটেছে।'));
      }
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden px-4 py-3 sm:px-6 sm:py-6">
      <div className="atmosphere" />
      <AuthAnimatedBackground />
      <div className="relative w-full max-w-[395px] sm:max-w-[425px] my-auto z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-card w-full p-5 sm:p-7 text-center relative z-10"
        >
        {/* Language Selector at Top Right of Login Card */}
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex items-center gap-1.5 z-20">
          <Globe size={13} className="text-accent/60" />
          <div className="inline-flex gap-0.5 bg-glass border border-glass-border p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onLanguageChange?.('en')}
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                language === 'en'
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm shadow-accent/10 font-bold"
                  : "text-faint hover:text-accent border border-transparent"
              )}
            >
              Eng
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange?.('bn')}
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                language === 'bn'
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm shadow-accent/10 font-bold"
                  : "text-faint hover:text-accent border border-transparent"
              )}
            >
              বাং
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-accent/30 shadow-[0_0_20px_rgba(0,242,255,0.18)]"
        >
          <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
        </motion.div>
        
        <h1 className="text-2xl sm:text-[26px] font-bold mb-1 tracking-tight">
          {language === 'en' ? 'Digital Hishab' : 'ডিজিটাল হিসাব'}
        </h1>
        <p className="text-muted mb-4 sm:mb-5 text-xs sm:text-sm">
          {authMode === 'login' && (language === 'en' ? 'Master your BDT portfolio with elegance.' : 'সহজ ও সুচারুভাবে আপনার পোর্টফোলিও পরিচালনা করুন।')}
          {authMode === 'register' && (language === 'en' ? 'Join the elite financial circle.' : 'আর্থিক হিসাব ব্যবস্থাপনায় যোগ দিন।')}
          {authMode === 'forgot' && (language === 'en' ? 'Recover your financial access.' : 'আপনার আর্থিক অ্যাকাউন্টের অ্যাক্সেস পুনরুদ্ধার করুন।')}
        </p>
        
        <form onSubmit={handleAuth} className="space-y-3 sm:space-y-3.5">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-accent/10 border border-accent/20 text-accent text-xs py-1.5 px-3 rounded-xl mb-2 flex flex-col gap-1.5"
              >
                <span>{error}</span>
                {error.includes('Account not found') && (
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                    }}
                    className="text-accent hover:underline font-bold text-[10px] uppercase tracking-widest text-left"
                  >
                    {language === 'en' ? 'Register Now →' : 'এখনই রেজিস্ট্রেশন করুন →'}
                  </button>
                )}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-accent/10 border border-accent/20 text-accent py-2.5 px-3.5 rounded-xl mb-3 text-center"
              >
                <div className="text-[9px] uppercase tracking-widest font-bold opacity-50 mb-0.5">
                  {language === 'en' ? 'System Message' : 'সিস্টেম বার্তা'}
                </div>
                <div className="text-base sm:text-lg font-mono font-bold tracking-[0.15em]">{success}</div>
                {authMode === 'forgot' && forgotStep === 'otp' && (
                  <div className="text-[10px] mt-1.5 opacity-60">
                    {language === 'en' 
                      ? 'Please enter this verification code to proceed.'
                      : 'এগিয়ে যেতে অনুগ্রহ করে এই যাচাইকরণ কোডটি লিখুন।'}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {authMode === 'register' && (
            <>
              <div className="space-y-1 text-left">
                <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                  {language === 'en' ? 'Full Name' : 'পূর্ণ নাম'} <span className="text-accent">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder={language === 'en' ? "John Doe" : "মোঃ রহিম আহমেদ"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-accent/50 transition-all duration-300 placeholder:text-faint text-primary"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                  {language === 'en' ? 'Date of Birth (DOB)' : 'জন্ম তারিখ (DOB)'} <span className="text-accent">*</span>
                </label>
                <input 
                  type="date" 
                  max={new Date().toISOString().split('T')[0]}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-accent/50 transition-all duration-300 placeholder:text-faint text-primary"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
              {language === 'en' ? 'Gmail Address' : 'জিমেইল এড্রেস'}
            </label>
            <input 
              type="email" 
              placeholder={language === 'en' ? "yourname@gmail.com" : "আপনারনাম@জিমেইল.কম"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-accent/50 transition-all duration-300 placeholder:text-faint disabled:opacity-50 text-primary"
              required
              disabled={authMode === 'forgot' && forgotStep !== 'email'}
            />
          </div>
          
          {(authMode === 'login' || authMode === 'register') && (
            <div className="space-y-1 text-left relative">
              <div className="flex justify-between items-center">
                <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                  {language === 'en' ? 'Password' : 'পাসওয়ার্ড'}
                </label>
                {authMode === 'register' && password && (
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest",
                    getPasswordStrength(password) < 2 ? "text-sky-400" : 
                    getPasswordStrength(password) < 4 ? "text-cyan-400" : "text-accent"
                  )}>
                    {language === 'en' ? 'Strength: ' : 'নিরাপত্তা বলয়: '} 
                    {getPasswordStrength(password) < 2 
                      ? (language === 'en' ? 'Weak' : 'দুর্বল') 
                      : getPasswordStrength(password) < 4 
                        ? (language === 'en' ? 'Medium' : 'মাঝারি') 
                        : (language === 'en' ? 'Strong' : 'শক্তিশালী')}
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-accent/50 transition-all duration-300 placeholder:text-faint pr-10 text-primary"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {authMode === 'register' && (
                <div className="flex gap-1 mt-1 px-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-500",
                        getPasswordStrength(password) >= i 
                          ? (getPasswordStrength(password) < 2 ? "bg-sky-500" : getPasswordStrength(password) < 4 ? "bg-cyan-500" : "bg-accent")
                          : "bg-glass"
                      )} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {authMode === 'forgot' && forgotStep === 'otp' && (
            <div className="space-y-1 text-left">
              <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                {language === 'en' ? 'Enter 6-Digit OTP' : '৬-সংখ্যার ওটিপি (OTP) লিখুন'}
              </label>
              <input 
                type="text" 
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-accent/50 transition-all duration-300 placeholder:text-faint text-primary"
                required
                maxLength={6}
              />
            </div>
          )}

          {authMode === 'forgot' && forgotStep === 'reset' && (
            <div className="space-y-1 text-left relative">
              <div className="flex justify-between items-center">
                <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                  {language === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'}
                </label>
                {newPassword && (
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest",
                    getPasswordStrength(newPassword) < 2 ? "text-sky-400" : 
                    getPasswordStrength(newPassword) < 4 ? "text-cyan-400" : "text-accent"
                  )}>
                    {language === 'en' ? 'Strength: ' : 'নিরাপত্তা বলয়: '}
                    {getPasswordStrength(newPassword) < 2 
                      ? (language === 'en' ? 'Weak' : 'দুর্বল') 
                      : getPasswordStrength(newPassword) < 4 
                        ? (language === 'en' ? 'Medium' : 'মাঝারি') 
                        : (language === 'en' ? 'Strong' : 'শক্তিশালী')}
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-glass border border-glass-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-accent/50 transition-all duration-300 placeholder:text-faint pr-10 text-primary"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="flex gap-1 mt-1 px-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-500",
                      getPasswordStrength(newPassword) >= i 
                        ? (getPasswordStrength(newPassword) < 2 ? "bg-sky-500" : getPasswordStrength(newPassword) < 4 ? "bg-cyan-500" : "bg-accent")
                        : "bg-glass"
                    )} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {authMode === 'login' && (
            <div className="text-right pt-0.5">
              <button 
                type="button"
                onClick={() => {
                  setAuthMode('forgot');
                  setForgotStep('email');
                  setError('');
                  setSuccess('');
                }}
                className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-faint hover:text-accent transition-colors"
              >
                {language === 'en' ? 'Forgot Password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
              </button>
            </div>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full bg-accent hover:bg-sky-400 text-bg-deep font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-md shadow-accent/20 mt-2.5 sm:mt-3 text-xs sm:text-sm tracking-wide"
          >
            {authMode === 'login' && (language === 'en' ? 'ACCESS TRACKER' : 'লগইন করুন')}
            {authMode === 'register' && (language === 'en' ? 'CREATE BDT ACCOUNT' : 'অ্যাকাউন্ট তৈরি করুন')}
            {authMode === 'forgot' && (
              forgotStep === 'email' ? (language === 'en' ? 'SEND OTP' : 'ওটিপি পাঠান') : 
              forgotStep === 'otp' ? (language === 'en' ? 'VERIFY OTP' : 'ওটিপি যাচাই করুন') : 
              (language === 'en' ? 'RESET PASSWORD' : 'পাসওয়ার্ড রিসেট করুন')
            )}
          </motion.button>
        </form>
        
        <div className="mt-3.5 sm:mt-4 space-y-1.5">
          {authMode === 'login' ? (
            <button 
              onClick={() => {
                setAuthMode('register');
                setError('');
                setSuccess('');
              }}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              {language === 'en' ? 'New to the platform?' : 'নতুন ইউজার?'}{' '}
              <span className="underline">
                {language === 'en' ? 'Register BDT Account' : 'রেজিস্ট্রেশন করুন'}
              </span>
            </button>
          ) : (
            <button 
              onClick={() => {
                setAuthMode('login');
                setForgotStep('email');
                setError('');
                setSuccess('');
              }}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              {language === 'en' ? 'Back to Sign In' : 'সাইন-ইন স্ক্রিনে ফিরে যান'}
            </button>
          )}
        </div>

        <p className="text-[9px] sm:text-[10px] text-faint mt-3 sm:mt-3.5 uppercase tracking-widest font-medium">
          {language === 'en' ? 'Bank-Grade Encryption Enabled' : 'ব্যাংক-গ্রেড নিরাপত্তা ব্যবস্থা সক্রিয়'}
        </p>
      </motion.div>
      </div>
    </div>
  );
}


function SidebarLink({ active, onClick, icon, label, imageUrl, id }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; imageUrl?: string; id?: string }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group relative text-left",
        active 
          ? "bg-accent/15 text-accent border border-accent/25 shadow-[0_2px_14px_var(--accent-glow)] font-semibold" 
          : "text-muted hover:text-primary hover:bg-white/[0.04] border border-transparent font-medium"
      )}
    >
      {active && (
        <span className="absolute left-1.5 top-2.5 bottom-2.5 w-1 bg-accent rounded-full shadow-[0_0_8px_var(--accent)]" />
      )}
      <span className={cn(
        "transition-all duration-200 w-5 h-5 flex items-center justify-center overflow-hidden rounded-full shrink-0",
        active ? "text-accent scale-105" : "text-muted group-hover:text-primary group-hover:scale-105"
      )}>
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : icon}
      </span>
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );
}

function NavButton({ active, onClick, icon, label, imageUrl, id }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; imageUrl?: string; id?: string }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all duration-200 relative py-2 px-1 sm:px-2 flex-1 group",
        active ? "text-accent" : "text-muted hover:text-primary"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute top-0 w-8 h-1 bg-accent rounded-full shadow-[0_0_10px_var(--accent)]"
        />
      )}
      <div className={cn(
        "w-5 h-5 flex items-center justify-center overflow-hidden rounded-full transition-transform",
        active ? "scale-110 text-accent" : "group-hover:scale-105"
      )}>
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : icon}
      </div>
      <span className="text-[9px] uppercase tracking-wider font-bold text-center whitespace-nowrap leading-none">{label}</span>
    </button>
  );
}

function BalanceDisplay({ transactions, currency = '৳', className, language = 'en' }: { transactions: Transaction[]; currency?: string; className?: string; language?: LanguageType }) {
  const balance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className={cn("font-extrabold tracking-tight tabular-nums truncate", className || "text-2xl sm:text-3xl md:text-4xl text-primary")}>
      {balance < 0 && '-'}{currency}{formatNumber(Math.abs(balance), language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
    </div>
  );
}

function SummaryCard({ title, amount, icon, color, timeFilter, currency = '৳', id, highlighted, language = 'en' }: { title: string; amount: number; icon: React.ReactNode; color: 'income' | 'expense' | 'primary'; timeFilter: string; currency?: string; id?: string; highlighted?: boolean; language?: LanguageType }) {
  return (
    <div 
      id={id} 
      className={cn(
        "group p-5 sm:p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-2xl",
        highlighted 
          ? "border-accent/40 bg-gradient-to-br from-accent/[0.14] via-glass to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.18)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-accent/60 before:to-transparent" 
          : "bg-glass/60 border-glass-border/40 hover:border-glass-border/90 hover:bg-glass/80 hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
      )}
    >
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className={cn(
          "p-3 rounded-2xl border transition-all shadow-sm",
          color === 'income' ? "bg-income/10 border-income/25 text-income" : 
          color === 'expense' ? "bg-expense/10 border-expense/25 text-expense" :
          highlighted ? "bg-accent/15 border-accent/30 text-accent shadow-[0_0_16px_var(--accent-glow)]" :
          "bg-sky-500/10 border-sky-500/25 text-sky-400"
        )}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/10 dark:bg-white/5 border border-glass-border/40 text-muted">
          {timeFilter === 'all' ? (language === 'en' ? 'All Time' : 'সর্বকালীন') :
           timeFilter === 'weekly' ? (language === 'en' ? 'Weekly' : 'সাপ্তাহিক') :
           timeFilter === 'monthly' ? (language === 'en' ? 'Monthly' : 'মাসিক') :
           timeFilter === 'yearly' ? (language === 'en' ? 'Yearly' : 'বার্ষিক') :
           timeFilter === 'Prior' ? (language === 'en' ? 'Prior Period' : 'পূর্ববর্তী পর্ব') :
           timeFilter}
        </div>
      </div>
      <h4 className="text-muted text-xs sm:text-sm font-medium mb-1.5 relative z-10">{title}</h4>
      <p className={cn(
        "font-extrabold truncate relative z-10 tracking-tight tabular-nums",
        highlighted ? "text-3xl sm:text-4xl text-accent drop-shadow-sm" : 
        color === 'income' ? "text-2xl sm:text-3xl text-income" :
        color === 'expense' ? "text-2xl sm:text-3xl text-expense" :
        "text-2xl sm:text-3xl text-primary"
      )}>
        {currency}{formatNumber(amount, language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function BudgetCard({ budget, setBudget, transactions, currency = '৳', previousBalance = 0, theme = 'dark', language = 'en' }: { budget: number; setBudget: (v: number) => void; transactions: Transaction[]; currency?: string; previousBalance?: number; theme?: 'light' | 'dark'; language?: LanguageType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const budgetTitle = language === 'en' ? "Monthly Budget Goal" : "মাসিক বাজেট লক্ষ্য";
  
  const percentage = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);
  const isOverBudget = budget > 0 && totalExpenses > budget;

  const donutData = budget > 0 ? [
    { name: language === 'en' ? 'Spent' : 'ব্যয়কৃত', value: totalExpenses, color: isOverBudget ? '#f72585' : 'var(--accent)' },
    { name: language === 'en' ? 'Remaining' : 'অবশিষ্ট', value: Math.max(budget - totalExpenses, 0), color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(14, 165, 233, 0.15)' }
  ] : [];

  const handleSave = () => {
    const enBudget = tempBudget
      .replace(/[০-৯]/g, (match) => {
        const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const idx = bnDigits.indexOf(match);
        return idx !== -1 ? enDigits[idx] : match;
      })
      .replace(/,/g, '.');
    const val = parseFloat(enBudget);
    if (!isNaN(val) && val >= 0) {
      setBudget(val);
      setIsEditing(false);
    }
  };

  return (
    <div id="tour-budget-card" className="glass-card relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20">
          <AlertCircle className={cn(isOverBudget ? "text-sky-400" : "text-accent")} size={20} />
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
        >
          {isEditing ? (language === 'en' ? 'Save' : 'সংরক্ষণ') : (language === 'en' ? 'Set Budget' : 'বাজেট নির্ধারণ')}
        </button>
      </div>
      
      <h4 className="text-muted text-sm font-medium mb-1">{budgetTitle}</h4>
      
      {isEditing ? (
        <input 
          autoFocus
          type="text"
          inputMode="decimal"
          value={tempBudget}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || /^[0-9.,০-৯]*$/.test(val)) {
              setTempBudget(val);
            }
          }}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="text-2xl font-extrabold tracking-tight tabular-nums bg-transparent border-b border-accent w-full focus:outline-none mb-4 text-primary"
        />
      ) : (
        <p className="text-2xl font-extrabold tracking-tight tabular-nums mb-4 text-primary">{currency}{formatNumber(budget, language)}</p>
      )}

      {budget > 0 || previousBalance > 0 ? (
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-4">
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className={index === 0 ? "drop-shadow-[0_0_10px_var(--accent-glow)]" : ""} 
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={cn(
                "text-2xl font-extrabold tracking-tight tabular-nums",
                isOverBudget ? "text-rose-400" : "text-primary"
              )}>
                {formatNumber(Math.round(clampedPercentage), language)}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted">
                {language === 'en' ? 'Spent' : 'ব্যয়কৃত'}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="p-4 rounded-2xl bg-glass border border-glass-border space-y-2">
              <div className="flex justify-between items-center text-[10px] text-muted font-bold uppercase tracking-widest">
                <span>{language === 'en' ? 'Monthly Target' : 'মাসিক লক্ষ্য'}</span>
                <span className="text-primary">{currency}{formatNumber(budget, language)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-glass border border-glass-border">
                <p className="text-[9px] uppercase tracking-widest text-faint font-bold mb-1">
                  {language === 'en' ? 'Spent' : 'ব্যয়কৃত'}
                </p>
                <p className={cn("text-sm font-mono font-bold", isOverBudget ? "text-sky-400" : "text-primary")}>
                  {currency}{formatNumber(totalExpenses, language)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-accent/5 border border-accent/20">
                <p className="text-[9px] uppercase tracking-widest text-accent font-black mb-1">
                  {language === 'en' ? 'Remaining Goal' : 'অবশিষ্ট লক্ষ্য'}
                </p>
                <p className="text-sm font-mono font-black text-income">
                  {currency}{formatNumber(Math.max(budget - totalExpenses, 0), language)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                <span className="text-faint">{language === 'en' ? 'Usage Intensity' : 'ব্যবহারের তীব্রতা'}</span>
                <span className={isOverBudget ? "text-sky-400" : "text-accent"}>
                  {isOverBudget 
                    ? (language === 'en' ? 'Critical' : 'আশঙ্কাজনক') 
                    : percentage > 80 
                    ? (language === 'en' ? 'Heavy' : 'উচ্চ') 
                    : percentage > 50 
                    ? (language === 'en' ? 'Moderate' : 'মধ্যম') 
                    : (language === 'en' ? 'Healthy' : 'স্বাভাবিক')}
                </span>
              </div>
              <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${clampedPercentage}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(14,165,233,0.3)]",
                    isOverBudget ? "bg-sky-500" : "bg-accent"
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center opacity-70">
          <div className="p-4 rounded-full bg-primary/5 border border-glass-border mb-4">
            <Target size={32} className="text-faint" />
          </div>
          <p className="text-sm font-bold">{language === 'en' ? 'Unset Budget' : 'অনির্ধারিত বাজেট'}</p>
          <p className="text-xs text-muted max-w-[200px]">
            {language === 'en' ? 'Set a monthly budget to unlock visual progress tracking' : 'ভিজ্যুয়াল প্রগতি ট্র্যাকিং চালু করতে একটি মাসিক বাজেট নির্ধারণ করুন'}
          </p>
        </div>
      )}

      {isOverBudget && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3"
        >
          <AlertCircle size={16} className="text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
              {language === 'en' ? 'Financial Stretch Alert' : 'আর্থিক টান সতর্কবার্তা'}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              {language === 'en' 
                ? `You've exceeded your budget by ${currency}${formatNumber(totalExpenses - budget, 'en')}. Consider reviewing your "Other" expenses to regain control.` 
                : `আপনি আপনার বাজেট ${currency}${formatNumber(totalExpenses - budget, 'bn')} অতিক্রম করেছেন! নিয়ন্ত্রণ ফিরে পেতে আপনার "অন্যান্য" ব্যয় পর্যালোচনা করুন।`}
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
            >
              {language === 'en' ? 'Adjust Budget Now →' : 'এখনই বাজেট সমন্বয় করুন →'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TransactionForm({ 
  onAdd, 
  transactions = [],
  currency = '৳',
  previousBalance = 0,
  language = 'en'
}: { 
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  transactions?: Transaction[];
  currency?: string;
  previousBalance?: number;
  language?: LanguageType;
}) {
  const t = translations[language];

  const getTranslatedCategory = (catName: string) => {
    const catMap: Record<string, keyof typeof t> = {
      'Bazar': 'catBazar',
      'Rickshaw/CNG': 'catRickshawCNG',
      'Mobile Recharge': 'catMobileRecharge',
      'Rent': 'catRent',
      'Utilities': 'catUtilities',
      'Tuition': 'catTuition',
      'Hostel': 'catHostel',
      'Food': 'catFood',
      'Shopping': 'catShopping',
      'Health': 'catHealth',
      'Entertainment': 'catEntertainment',
      'Salary': 'catSalary',
      'Other': 'catOther',
      'Investment': 'catInvestment',
      'Gift': 'catGift'
    };
    const key = catMap[catName];
    if (key && t[key]) {
      return t[key] as string;
    }
    return catName;
  };
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [linkedIncomeIds, setLinkedIncomeIds] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const effectivePreviousBalance = useMemo(() => {
    if (previousBalance > 0) return previousBalance;
    const txDate = parseLocalDate(date);
    const startOfCurrentMonth = new Date(txDate.getFullYear(), txDate.getMonth(), 1);
    const priorSavings = transactions
      .filter(t => parseLocalDate(t.date) < startOfCurrentMonth)
      .reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount || 0) : acc - Number(t.amount || 0), 0);
    return Math.max(0, priorSavings);
  }, [previousBalance, transactions, date]);

  const incomeSourceStats = useMemo(() => {
    const stats: Record<string, { initial: number; remaining: number }> = {
      'PRIOR_SAVINGS': { initial: Math.max(0, effectivePreviousBalance), remaining: Math.max(0, effectivePreviousBalance) }
    };
    
    // Initialize with income amounts
    transactions.forEach(t => {
      if (t.type === 'income') {
        const amt = Math.max(0, Number(t.amount) || 0);
        stats[t.id] = { initial: amt, remaining: amt };
      }
    });

    // Subtract expense amounts to find remaining
    transactions.forEach(t => {
      if (t.type === 'expense' && t.linkedIncomeIds && t.linkedIncomeIds.length > 0) {
        const validIds = t.linkedIncomeIds.filter(id => stats[id]);
        if (validIds.length > 0) {
          const share = Number(t.amount || 0) / validIds.length;
          validIds.forEach(id => {
            stats[id].remaining -= share;
          });
        }
      }
    });

    // Normalize precision and clamp remaining between 0 and initial
    Object.keys(stats).forEach(id => {
      const rounded = Math.round(stats[id].remaining * 100) / 100;
      stats[id].remaining = Math.min(stats[id].initial, Math.max(0, Math.abs(rounded) < 0.001 ? 0 : rounded));
    });

    return stats;
  }, [transactions, effectivePreviousBalance]);

  const incomeTransactions = useMemo(() => {
    const txDate = parseLocalDate(date);
    const targetMonth = txDate.getMonth();
    const targetYear = txDate.getFullYear();

    return transactions
      .filter(t => {
        if (t.type !== 'income') return false;
        const d = parseLocalDate(t.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enAmount = amount
      .replace(/[০-৯]/g, (match) => {
        const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const idx = bnDigits.indexOf(match);
        return idx !== -1 ? enDigits[idx] : match;
      })
      .replace(/,/g, '.');
    const parsedAmount = parseFloat(enAmount);
    if (!amount || !category || !date || isNaN(parsedAmount)) return;

    if (parsedAmount <= 0) {
      setNotification({
        message: language === 'en' ? 'Amount must be greater than 0.' : 'পরিমাণ অবশ্যই ০ এর বেশি হতে হবে।',
        type: 'warning'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const currentOverallBalance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const proposedBalance = currentOverallBalance + (type === 'income' ? parsedAmount : -parsedAmount);
    if (proposedBalance < 0) {
      setNotification({
        message: language === 'en' 
          ? `Transaction rejected! This would result in a negative net balance of ${currency}${formatNumber(proposedBalance, 'en')} in your account.`
          : `লেনদেন প্রত্যাখ্যাত! এর ফলে আপনার অ্যাকাউন্টে ${currency}${formatNumber(proposedBalance, 'bn')} ঋণাত্মক ব্যালেন্স তৈরি হবে।`,
        type: 'warning'
      });
      setTimeout(() => setNotification(null), 6000);
      return;
    }

    // Check if any selected income gets fully spent
    if (type === 'expense' && linkedIncomeIds.length > 0) {
      const share = parsedAmount / linkedIncomeIds.length;
      const fullySpentIncomes: string[] = [];

      linkedIncomeIds.forEach(id => {
        const stats = incomeSourceStats[id];
        if (stats && stats.remaining - share <= 0.01) { // Floating point safety
          const name = id === 'PRIOR_SAVINGS' 
            ? (language === 'en' ? 'Prior Month Savings' : 'পূর্ববর্তী সঞ্চয়') 
            : (getLocalizedDescription(transactions.find(inc => inc.id === id)?.description || '', language) || (language === 'en' ? 'Income' : 'আয়'));
          fullySpentIncomes.push(name);
        }
      });

      if (fullySpentIncomes.length > 0) {
        setNotification({
          message: language === 'en'
            ? `Notice: ${fullySpentIncomes.join(', ')} ${fullySpentIncomes.length > 1 ? 'have' : 'has'} been fully spent!`
            : `সতর্কতা: ${fullySpentIncomes.join(', ')} সম্পূর্ণ ব্যয় হয়ে গেছে!`,
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    }

    onAdd({
      amount: parsedAmount,
      category,
      customCategory: category === 'Other' ? customCategory : null,
      date,
      description: description || (category === 'Other' ? customCategory : category),
      type,
      linkedIncomeIds: type === 'expense' ? linkedIncomeIds : null
    });

    setAmount('');
    setCategory('');
    setCustomCategory('');
    setDescription('');
    setLinkedIncomeIds([]);
  };

  const toggleIncomeSource = (id: string) => {
    setLinkedIncomeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex p-1 glass rounded-xl">
        <button 
          type="button"
          onClick={() => {
            if (type !== 'expense') {
              setType('expense');
              setAmount('');
              setCategory('');
              setCustomCategory('');
              setDescription('');
              setLinkedIncomeIds([]);
            }
          }}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
            type === 'expense' ? "bg-expense text-white shadow-lg shadow-expense/20" : "text-muted hover:text-accent"
          )}
        >
          {t.expense}
        </button>
        <button 
          type="button"
          onClick={() => {
            if (type !== 'income') {
              setType('income');
              setAmount('');
              setCategory('');
              setCustomCategory('');
              setDescription('');
              setLinkedIncomeIds([]);
            }
          }}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
            type === 'income' ? "bg-income text-white shadow-lg shadow-income/20" : "text-muted hover:text-accent"
          )}
        >
          {t.income}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "col-span-full p-3 rounded-xl flex items-center gap-2 text-xs font-bold",
              notification.type === 'warning' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            )}
          >
            <AlertCircle size={14} />
            {notification.message}
          </motion.div>
        )}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
            {language === 'en' ? `Amount (${currency})` : `পরিমাণ (${currency})`}
          </label>
          <input 
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^[0-9.,০-৯]*$/.test(val)) {
                setAmount(val);
              }
            }}
            className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary placeholder:text-faint"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
            {language === 'en' ? 'Date' : 'তারিখ'}
          </label>
          <div className="relative flex items-center">
            <input 
              type="text"
              placeholder={language === 'en' ? "YYYY-MM-DD" : "বছর-মাস-দিন"}
              value={language === 'bn' ? toBanglaNumerals(date) : date}
              onChange={(e) => setDate(toEnglishNumerals(e.target.value))}
              className="w-full bg-glass border border-glass-border rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-accent/40 text-primary font-semibold transition-all"
              required
            />
            <div className="absolute left-4 text-accent pointer-events-none">
              <Calendar size={16} />
            </div>
            <button 
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="absolute right-3 p-1.5 rounded-lg hover:bg-white/5 text-accent transition-all duration-150 cursor-pointer"
              title={language === 'en' ? "Open Calendar Picker" : "ক্যালেন্ডার খুলুন"}
            >
              <Calendar size={16} />
            </button>
            {showCalendar && (
              <div className="absolute top-full left-0 z-[999] mt-2">
                <CalendarPicker
                  selectedDate={new Date(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date())}
                  language={language}
                  onSelect={(d) => {
                    if (d) {
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      setDate(`${yyyy}-${mm}-${dd}`);
                      setShowCalendar(false);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1 relative">
        <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
          {language === 'en' ? 'Category' : 'ক্যাটাগরি'}
        </label>
        <div className="relative">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 appearance-none pr-10 text-primary"
            required
          >
            <option value="" disabled className="bg-bg-deep">
              {language === 'en' ? 'Select Category' : 'ক্যাটাগরি নির্বাচন করুন'}
            </option>
            {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
              <option key={cat} value={cat} className="bg-bg-deep">
                {getTranslatedCategory(cat)}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-faint">
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>
      </div>

      {category === 'Other' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-1"
        >
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
            {language === 'en' ? 'Custom Category Name' : 'কাস্টম ক্যাটাগরি নাম'}
          </label>
          <input 
            type="text"
            placeholder={language === 'en' ? "e.g., Gift, Bonus, etc." : "যেমন- উপহার, বোনাস ইত্যাদি"}
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary placeholder:text-faint"
            required
          />
        </motion.div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
          {language === 'en' ? 'Description' : 'বিবরণ'}
        </label>
        <input 
          type="text"
          placeholder={language === 'en' ? "What was this for?" : "এটি কিসের জন্য ছিল?"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary placeholder:text-faint"
        />
      </div>

      {type === 'expense' && (incomeTransactions.length > 0 || effectivePreviousBalance > 0) && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1 flex justify-between">
            <span>{language === 'en' ? 'Spent from (Choose multiple)' : 'ব্যয়ের উৎস (একাধিক নির্বাচন করা যাবে)'}</span>
            {linkedIncomeIds.length > 0 && (
              <span className="text-accent">
                {language === 'en' ? `${linkedIncomeIds.length} selected` : `${linkedIncomeIds.length}টি নির্বাচিত`}
              </span>
            )}
          </label>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {effectivePreviousBalance > 0 && (() => {
              const stats = incomeSourceStats['PRIOR_SAVINGS'] || { initial: 0, remaining: 0 };
              const isSpent = stats.remaining <= 0;
              const isSelected = linkedIncomeIds.includes('PRIOR_SAVINGS');
              const spentAmount = stats.initial - stats.remaining;
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpent && !isSelected) {
                      setNotification({
                        message: language === 'en'
                          ? "Prior Month Savings is already fully spent by other expenses."
                          : "পূর্ববর্তী মাসের সঞ্চয় ইতোমধ্যেই অন্যান্য ব্যয়ের মাধ্যমে সম্পূর্ণ খরচ হয়ে গেছে।",
                        type: 'warning'
                      });
                      setTimeout(() => setNotification(null), 4000);
                      return;
                    }
                    toggleIncomeSource('PRIOR_SAVINGS');
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                    isSelected
                      ? "bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(76,201,240,0.1)]"
                      : isSpent ? "bg-primary/5 border-glass-border opacity-50 cursor-pointer" : "bg-glass border-glass-border text-muted hover:border-accent/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      isSelected ? "bg-accent border-accent" : "border-faint"
                    )}>
                      {isSelected && <Check size={12} className="text-bg-deep" />}
                      {isSpent && !isSelected && <X size={10} className="text-rose-500 font-bold" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">
                        {language === 'en' ? 'Prior Month Savings' : 'পূর্ববর্তী মাসের সঞ্চয়'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-70">
                          {language === 'en' ? 'Spent:' : 'ব্যয়কৃত:'} {currency}{formatNumber(spentAmount, language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                        {isSpent && (
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter">
                            {language === 'en' ? 'Fully Spent' : 'সম্পূর্ণ শেষ'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono block">{currency}{formatNumber(Math.max(0, stats.remaining), language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    <span className="text-[9px] opacity-40">
                      {language === 'en' ? 'remaining' : 'অবশিষ্ট'}
                    </span>
                  </div>
                </button>
              );
            })()}
            {incomeTransactions.map(inc => {
              const stats = incomeSourceStats[inc.id] || { initial: 0, remaining: 0 };
              const isSpent = stats.remaining <= 0;
              const isSelected = linkedIncomeIds.includes(inc.id);
              const spentAmount = stats.initial - stats.remaining;
              const incTitle = getLocalizedDescription(inc.description, language) || getTranslatedCategory(inc.category);
              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => {
                    if (isSpent && !isSelected) {
                      setNotification({
                        message: language === 'en'
                          ? `"${incTitle}" is already fully spent by other expenses.`
                          : `"${incTitle}" ইতোমধ্যেই অন্যান্য ব্যয়ের মাধ্যমে সম্পূর্ণ খরচ হয়ে গেছে।`,
                        type: 'warning'
                      });
                      setTimeout(() => setNotification(null), 4000);
                      return;
                    }
                    toggleIncomeSource(inc.id);
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                    isSelected
                      ? "bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(76,201,240,0.1)]"
                      : isSpent ? "bg-primary/5 border-glass-border opacity-50 cursor-pointer" : "bg-glass border-glass-border text-muted hover:border-accent/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all",
                      isSelected ? "bg-accent border-accent" : "border-faint"
                    )}>
                      {isSelected && <Check size={12} className="text-bg-deep" />}
                      {isSpent && !isSelected && <X size={10} className="text-rose-500 font-bold" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-[150px]">{getLocalizedDescription(inc.description, language)}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[10px] opacity-60">{getTranslatedCategory(inc.category)}</span>
                        <span className="text-[10px] text-sky-400/80 font-medium">
                          {language === 'en' ? 'Spent:' : 'ব্যয়কৃত:'} {currency}{formatNumber(spentAmount, language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                        {isSpent && (
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter">
                            {language === 'en' ? 'Fully Spent' : 'সম্পূর্ণ শেষ'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono block">{currency}{formatNumber(Math.max(0, stats.remaining), language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    <span className="text-[9px] opacity-40">{language === 'en' ? 'remaining' : 'অবশিষ্ট'}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {linkedIncomeIds.length === 0 && (
            <p className="text-[9px] text-faint italic ml-1">
              {language === 'en' ? '* Defaults to General Balance' : '* কোনো নির্দিষ্ট উৎস নির্ধারণ না করলে সাধারণ ব্যালেন্স ব্যবহার করা হবে'}
            </p>
          )}
        </div>
      )}

                  <button 
                    type="submit"
                    className="w-full bg-accent text-white py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                  >
                    <Plus size={18} /> {language === 'en' ? 'Add Entry' : 'লেনদেন যোগ করুন'}
                  </button>
    </form>
  );
}

function TransactionList({ 
  transactions, 
  onDelete, 
  onEdit,
  compact = false,
  currency = '৳',
  allTransactions = [],
  language = 'en'
}: { 
  transactions: Transaction[]; 
  onDelete: (id: string) => void; 
  onEdit: (t: Transaction) => void;
  compact?: boolean;
  currency?: string;
  allTransactions?: Transaction[];
  language?: LanguageType;
}) {
  if (transactions.length === 0) {
    return (
              <div className="py-12 text-center text-faint italic">
                {language === 'en' ? 'No transactions yet.' : 'কোনো লেনদেনের তথ্য পাওয়া যায়নি।'}
              </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {transactions.map((t) => (
          <TransactionItem 
            key={t.id} 
            t={t} 
            onDelete={onDelete} 
            onEdit={onEdit} 
            compact={compact} 
            currency={currency} 
            allTransactions={allTransactions}
            language={language}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function TransactionItem({ 
  t, 
  onDelete, 
  onEdit,
  compact,
  currency = '৳',
  allTransactions = [],
  language = 'en'
}: { 
  t: Transaction; 
  onDelete: (id: string) => void; 
  onEdit: (t: Transaction) => void;
  compact: boolean;
  currency?: string;
  allTransactions?: Transaction[];
  language?: LanguageType;
  key?: string 
}) {
  const displayCategory = (() => {
    const orig = t.category === 'Other' ? (t.customCategory || 'Other') : t.category;
    if (t.category === 'Other' && t.customCategory) return t.customCategory;
    const catMap: Record<string, string> = {
      'Bazar': 'catBazar',
      'Rickshaw/CNG': 'catRickshawCNG',
      'Mobile Recharge': 'catMobileRecharge',
      'Rent': 'catRent',
      'Utilities': 'catUtilities',
      'Tuition': 'catTuition',
      'Hostel': 'catHostel',
      'Food': 'catFood',
      'Shopping': 'catShopping',
      'Health': 'catHealth',
      'Entertainment': 'catEntertainment',
      'Salary': 'catSalary',
      'Other': 'catOther',
      'Investment': 'catInvestment',
      'Gift': 'catGift'
    };
    const transKey = catMap[t.category];
    const transSet = translations[language || 'en'];
    if (transKey && transSet[transKey as keyof typeof transSet]) {
      return transSet[transKey as keyof typeof transSet] as string;
    }
    return orig;
  })();
  
  const linkedIncomes = useMemo(() => {
    const ids = t.linkedIncomeIds || [];
    return ids.map(id => {
      if (id === 'PRIOR_SAVINGS') return { id, description: language === 'en' ? 'Prior Month Savings' : 'পূর্ববর্তী সঞ্চয়', amount: 0 };
      return allTransactions.find(inc => inc.id === id);
    }).filter(Boolean) as (Transaction | { id: string; description: string; amount: number })[];
  }, [t.linkedIncomeIds, allTransactions, language]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-glass/50 border border-glass-border/40 hover:border-glass-border/90 hover:bg-glass/80 transition-all duration-200 cursor-default shadow-xs"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className={cn(
          "p-2.5 sm:p-3 rounded-xl shrink-0 border transition-all",
          t.type === 'income' 
            ? "bg-income/10 text-income border-income/25 shadow-sm" 
            : "bg-expense/10 text-expense border-expense/25 shadow-sm"
        )}>
          {CATEGORIES[t.category]?.icon || <DollarSign size={18} />}
        </div>
        <div className="min-w-0">
          <h5 className="font-semibold text-sm truncate text-primary">{getLocalizedDescription(t.description, language)}</h5>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted font-bold">
              <span className="truncate max-w-[90px] sm:max-w-none">{displayCategory}</span>
              <span>•</span>
              <span className="shrink-0">{new Date(t.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
            {linkedIncomes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {linkedIncomes.map((inc, idx) => (
                  <div key={inc.id} className="flex items-center gap-1 text-[9px] font-bold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-md">
                    {idx === 0 && <LinkIcon size={8} />}
                    <span>{getLocalizedDescription(inc.description, language)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-3">
        <div className={cn(
          "font-extrabold text-sm sm:text-base tracking-tight tabular-nums",
          t.type === 'income' ? "text-income" : "text-expense"
        )}>
          {t.type === 'income' ? '+' : '-'}{currency}{formatNumber(t.amount, language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </div>
        {!compact && (
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
            <button 
              onClick={() => onEdit(t)}
              className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
              title={language === 'en' ? 'Edit' : 'সম্পাদনা'}
            >
              <Edit2 size={15} />
            </button>
            <button 
              onClick={() => onDelete(t.id)}
              className="p-2 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              title={language === 'en' ? 'Delete' : 'মুছুন'}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CategoryChart({ transactions, currency = '৳', language = 'en' }: { transactions: Transaction[]; currency?: string; language?: LanguageType }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const getTranslatedCategory = (catName: string) => {
    if (language !== 'bn') return catName;
    const catMap: Record<string, string> = {
      'Bazar': 'বাজার',
      'Rickshaw/CNG': 'রিকশা / সিএনজি',
      'Mobile Recharge': 'মোবাইল রিচার্জ',
      'Rent': 'ভাড়া',
      'Utilities': 'ইউটিলিটি বিল',
      'Tuition': 'টিউশনি',
      'Hostel': 'হোস্টেল',
      'Food': 'খাবার',
      'Shopping': 'কেনাকাটা',
      'Health': 'স্বাস্থ্য',
      'Entertainment': 'বিনোদন',
      'Salary': 'বেতন',
      'Other': 'অন্যান্য',
      'Investment': 'বিনিয়োগ',
      'Gift': 'উপহার'
    };
    return catMap[catName] || catName;
  };

  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories: Record<string, number> = {};
    
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: CATEGORIES[name]?.color || '#64748b'
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 15) * cos;
    const my = cy + (outerRadius + 15) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 15;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="var(--text-primary)" className="text-sm sm:text-lg font-bold">
          {getTranslatedCategory(payload.name)}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 4}
          outerRadius={outerRadius + 6}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="var(--text-primary)" className="text-xs font-black">
          {`${currency}${formatNumber(value, language)}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={16} textAnchor={textAnchor} fill="#999" className="text-[10px] font-medium">
          {`(${formatNumber(percent * 100, language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)`}
        </text>
      </g>
    );
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 8;
    const x = cx + radius * Math.cos(-RADIAN * midAngle);
    const y = cy + radius * Math.sin(-RADIAN * midAngle);

    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--text-secondary)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[10px] sm:text-xs font-black uppercase tracking-tight"
      >
        {`${getTranslatedCategory(name).slice(0, 10)} ${formatNumber(percent * 100, language, { maximumFractionDigits: 0 })}%`}
      </text>
    );
  };

  if (data.length === 0) return <div className="h-full flex items-center justify-center text-faint italic text-sm">{language === 'bn' ? 'কোনো ডাটা নেই' : 'No data'}</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
        <Pie
          {...({ activeIndex, activeShape: renderActiveShape } as any)}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={55}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
          onMouseEnter={onPieEnter}
          animationBegin={0}
          animationDuration={1500}
          label={renderCustomizedLabel}
          labelLine={{ stroke: 'var(--glass-border)', strokeWidth: 1 }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ display: 'none' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ComparisonBarChart({ transactions, currency = '৳', language = 'en' }: { transactions: Transaction[]; currency?: string; language?: LanguageType }) {
  const getTranslatedCategory = (catName: string) => {
    if (language !== 'bn') return catName;
    const catMap: Record<string, string> = {
      'Bazar': 'বাজার',
      'Rickshaw/CNG': 'রিকশা / সিএনজি',
      'Mobile Recharge': 'মোবাইল রিচার্জ',
      'Rent': 'ভাড়া',
      'Utilities': 'ইউটিলিটি বিল',
      'Tuition': 'টিউশনি',
      'Hostel': 'হোস্টেল',
      'Food': 'খাবার',
      'Shopping': 'কেনাকাটা',
      'Health': 'স্বাস্থ্য',
      'Entertainment': 'বিনোদন',
      'Salary': 'বেতন',
      'Other': 'অন্যান্য',
      'Investment': 'বিনিয়োগ',
      'Gift': 'উপহার'
    };
    return catMap[catName] || catName;
  };

  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories: Record<string, number> = {};
    
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return Object.entries(categories).map(([name, value]) => {
      const color = CATEGORIES[name]?.color || '#64748b';
      return {
        name: getTranslatedCategory(name),
        value,
        color
      };
    }).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions, language]);

  if (data.length === 0) return <div className="h-full flex items-center justify-center text-muted italic text-sm">{language === 'bn' ? 'কোনো ডাটা নেই' : 'No data'}</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 10, right: 10, top: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="var(--text-secondary)" 
          fontSize={11}
          fontWeight="bold"
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={70}
        />
        <YAxis hide />
        <Tooltip 
          cursor={{ fill: 'var(--glass)' }}
          contentStyle={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--text-primary)' }}
          formatter={(value: number) => [`${currency}${formatNumber(value, language)}`, language === 'bn' ? 'টাকার পরিমাণ' : 'Amount']}
        />
        <Bar 
          dataKey="value" 
          radius={[6, 6, 0, 0]} 
          barSize={30}
          animationBegin={500}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ComparisonSummary({ transactions, currency = '৳', language = 'en' }: { transactions: Transaction[]; currency: string; language?: LanguageType }) {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonthRaw = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonthRaw && d.getFullYear() === lastMonthYear;
    });

    const thisMonthExpense = thisMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const lastMonthExpense = lastMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const diff = thisMonthExpense - lastMonthExpense;
    const percentage = lastMonthExpense === 0 ? 0 : (diff / lastMonthExpense) * 100;

    return {
      thisMonthExpense,
      lastMonthExpense,
      diff,
      percentage
    };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
      <div className="p-5 glass rounded-2xl">
        <div className="flex justify-between items-start mb-3">
          <p className="text-xs uppercase tracking-widest text-muted font-black">
            {language === 'en' ? 'This Month' : 'চলতি মাস'}
          </p>
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shadow-sm shadow-sky-500/10">
            <TrendingDown size={16} />
          </div>
        </div>
        <p className="text-2xl font-black tracking-tight">{currency}{formatNumber(stats.thisMonthExpense, language)}</p>
        <p className="text-xs text-muted mt-2 font-medium italic opacity-70">
          {language === 'en' ? 'Current spending velocity' : 'চলতি মাসের খরচের গতিবেগ'}
        </p>
      </div>

      <div className="p-5 glass rounded-2xl">
        <div className="flex justify-between items-start mb-3">
          <p className="text-xs uppercase tracking-widest text-muted font-black">
            {language === 'en' ? 'Vs Last Month' : 'গত মাসের তুলনায়'}
          </p>
          <div className={cn(
            "p-2 rounded-lg flex items-center gap-1.5 text-xs font-black shadow-sm",
            stats.diff > 0 ? "bg-sky-500/10 text-sky-400 shadow-sky-500/10" : "bg-accent/10 text-accent shadow-accent/10"
          )}>
            {stats.diff > 0 ? <Plus size={12} /> : <Minus size={12} />}
            {formatNumber(Math.abs(stats.percentage), language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
          </div>
        </div>
        <p className={cn(
          "text-2xl font-black tracking-tight",
          stats.diff > 0 ? "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.2)]" : "text-accent drop-shadow-[0_0_8px_rgba(76,201,240,0.2)]"
        )}>
          {stats.diff > 0 ? '+' : '-'}{currency}{formatNumber(Math.abs(stats.diff), language)}
        </p>
        <p className="text-xs text-muted mt-2 font-medium italic opacity-70">
          {language === 'en' 
            ? `${stats.diff > 0 ? "Spending is up" : "Spending is down"} compared to last month`
            : `গত মাসের তুলনায় খরচ ${stats.diff > 0 ? 'বৃদ্ধি পেয়েছে' : 'হ্রাস পেয়েছে'}`}
        </p>
      </div>
    </div>
  );
}

function MonthlyComparisonChart({ transactions, currency = '৳', language = 'en' }: { transactions: Transaction[]; currency?: string; language?: LanguageType }) {
  const data = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonthRaw = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      
      const thisMonthVal = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
      }).reduce((acc, t) => acc + t.amount, 0);

      const lastMonthVal = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === day && d.getMonth() === lastMonthRaw && d.getFullYear() === lastMonthYear && t.type === 'expense';
      }).reduce((acc, t) => acc + t.amount, 0);

      return {
        day,
        thisMonth: thisMonthVal,
        lastMonth: lastMonthVal,
      };
    });
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id="colorThis" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorLast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="day" 
          stroke="var(--text-secondary)" 
          fontSize={11} 
          fontWeight="bold"
          tickLine={false}
          axisLine={false}
          label={{ value: language === 'bn' ? 'দিন' : 'Day', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 'bold' }}
        />
        <YAxis 
          stroke="var(--text-secondary)" 
          fontSize={11} 
          fontWeight="bold"
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => {
            if (value >= 1000) {
              return `${currency}${formatNumber(value / 1000, language, { maximumFractionDigits: 0 })} ${language === 'bn' ? 'কে' : 'k'}`;
            }
            return `${currency}${formatNumber(value, language)}`;
          }}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--text-primary)' }}
          formatter={(value: number) => [`${currency}${formatNumber(value, language)}`, '']}
        />
        <Area 
          type="monotone" 
          dataKey="thisMonth" 
          name={language === 'bn' ? 'চলতি মাস' : 'Current Month'}
          stroke="var(--accent)" 
          fillOpacity={1} 
          fill="url(#colorThis)" 
          strokeWidth={2}
          animationDuration={1500}
        />
        <Area 
          type="monotone" 
          dataKey="lastMonth" 
          name={language === 'bn' ? 'পূর্ববর্তী মাস' : 'Previous Month'}
          stroke="#94a3b8" 
          fillOpacity={1} 
          fill="url(#colorLast)" 
          strokeWidth={1.5}
          strokeDasharray="4 4"
          animationDuration={2000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrendChart({ transactions, currency = '৳', language = 'en' }: { transactions: Transaction[]; currency?: string; language?: LanguageType }) {
  const data = useMemo(() => {
    // If we have transactions, determine the range to show
    // Otherwise default to last 7 days
    let dates: string[] = [];
    
    if (transactions.length > 0) {
      // Find the range of dates in the transactions
      const sortedDates = [...transactions].map(t => t.date).sort();
      const firstDate = new Date(sortedDates[0]);
      const lastDate = new Date(sortedDates[sortedDates.length - 1]);
      
      // If the range is small (e.g. within 14 days), show the actual range
      const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays <= 31) {
        // Show the range from first to last date in transactions
        for (let i = 0; i <= diffDays; i++) {
          const d = new Date(firstDate);
          d.setDate(firstDate.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
        }
      }
    }
    
    // Fallback: Last 7 days from now
    if (dates.length === 0) {
      dates = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();
    }

    return dates.map(date => {
      const dayTransactions = transactions.filter(t => t.date === date);
      const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      
      return {
        date: new Date(date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' }),
        income,
        expense
      };
    });
  }, [transactions, language]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          stroke="var(--text-secondary)" 
          fontSize={11} 
          fontWeight="bold"
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="var(--text-secondary)" 
          fontSize={11} 
          fontWeight="bold"
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `${currency}${formatNumber(value, language)}`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--text-primary)' }}
          formatter={(value: number) => [`${currency}${formatNumber(value, language)}`, '']}
        />
        <Area 
          type="monotone" 
          dataKey="income" 
          name={language === 'bn' ? 'আয়' : 'Income'}
          stroke="var(--color-income)" 
          fillOpacity={1} 
          fill="url(#colorIncome)" 
          strokeWidth={3}
        />
        <Area 
          type="monotone" 
          dataKey="expense" 
          name={language === 'bn' ? 'ব্যয়' : 'Expense'}
          stroke="var(--color-expense)" 
          fillOpacity={1} 
          fill="url(#colorExpense)" 
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TransactionEditModal({ 
  transaction, 
  onClose, 
  onUpdate,
  transactions = [],
  currency = '৳',
  previousBalance = 0,
  language = 'en'
}: { 
  transaction: Transaction; 
  onClose: () => void; 
  onUpdate: (id: string, data: Omit<Transaction, 'id'>) => void;
  transactions?: Transaction[];
  currency?: string;
  previousBalance?: number;
  language?: LanguageType;
}) {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [customCategory, setCustomCategory] = useState(transaction.customCategory || '');
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description || '');
  const [linkedIncomeIds, setLinkedIncomeIds] = useState<string[]>(transaction.linkedIncomeIds || []);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const getCategoryName = (cat: string) => {
    const catMap: Record<string, string> = {
      'Bazar': 'catBazar',
      'Rickshaw/CNG': 'catRickshawCNG',
      'Mobile Recharge': 'catMobileRecharge',
      'Rent': 'catRent',
      'Utilities': 'catUtilities',
      'Tuition': 'catTuition',
      'Hostel': 'catHostel',
      'Food': 'catFood',
      'Shopping': 'catShopping',
      'Health': 'catHealth',
      'Entertainment': 'catEntertainment',
      'Salary': 'catSalary',
      'Other': 'catOther',
      'Investment': 'catInvestment',
      'Gift': 'catGift'
    };
    const transKey = catMap[cat];
    const transSet = translations[language];
    if (transKey && transSet[transKey as keyof typeof transSet]) {
      return transSet[transKey as keyof typeof transSet] as string;
    }
    return cat;
  };

  const effectivePreviousBalance = useMemo(() => {
    if (previousBalance > 0) return previousBalance;
    const txDate = parseLocalDate(date);
    const startOfCurrentMonth = new Date(txDate.getFullYear(), txDate.getMonth(), 1);
    const priorSavings = transactions
      .filter(t => parseLocalDate(t.date) < startOfCurrentMonth)
      .reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount || 0) : acc - Number(t.amount || 0), 0);
    return Math.max(0, priorSavings);
  }, [previousBalance, transactions, date]);

  const incomeSourceStats = useMemo(() => {
    const stats: Record<string, { initial: number; remaining: number }> = {
      'PRIOR_SAVINGS': { initial: Math.max(0, effectivePreviousBalance), remaining: Math.max(0, effectivePreviousBalance) }
    };
    
    // Initialize with income amounts
    transactions.forEach(t => {
      if (t.type === 'income') {
        const amt = Math.max(0, Number(t.amount) || 0);
        stats[t.id] = { initial: amt, remaining: amt };
      }
    });

    // Subtract expense amounts
    transactions.forEach(t => {
      if (t.type === 'expense' && t.linkedIncomeIds && t.linkedIncomeIds.length > 0) {
        // Skip current transaction to see "Available" before this transaction's impact
        if (t.id === transaction.id) return;

        const validIds = t.linkedIncomeIds.filter(id => stats[id]);
        if (validIds.length > 0) {
          const share = Number(t.amount || 0) / validIds.length;
          validIds.forEach(id => {
            stats[id].remaining -= share;
          });
        }
      }
    });

    // Normalize precision and clamp remaining between 0 and initial
    Object.keys(stats).forEach(id => {
      const rounded = Math.round(stats[id].remaining * 100) / 100;
      stats[id].remaining = Math.min(stats[id].initial, Math.max(0, Math.abs(rounded) < 0.001 ? 0 : rounded));
    });

    return stats;
  }, [transactions, effectivePreviousBalance, transaction.id]);

  const incomeTransactions = useMemo(() => {
    const txDate = parseLocalDate(date);
    const targetMonth = txDate.getMonth();
    const targetYear = txDate.getFullYear();

    return transactions
      .filter(t => {
        if (t.type !== 'income' || t.id === transaction.id) return false;
        const d = parseLocalDate(t.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, transaction.id, date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enAmount = amount
      .replace(/[০-৯]/g, (match) => {
        const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const idx = bnDigits.indexOf(match);
        return idx !== -1 ? enDigits[idx] : match;
      })
      .replace(/,/g, '.');
    const parsedAmount = parseFloat(enAmount);
    if (!amount || !category || !date || isNaN(parsedAmount)) return;

    if (parsedAmount <= 0) {
      setNotification({
        message: language === 'en' ? 'Amount must be greater than 0.' : 'পরিমাণ অবশ্যই ০ এর বেশি হতে হবে।',
        type: 'warning'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const otherTransactionsBalance = transactions
      .filter(t => t.id !== transaction.id)
      .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

    const proposedBalance = otherTransactionsBalance + (type === 'income' ? parsedAmount : -parsedAmount);
    if (proposedBalance < 0) {
      setNotification({
        message: language === 'en' 
          ? `Transaction edit rejected! This would result in a negative net balance of ${currency}${formatNumber(proposedBalance, 'en')} in your account.`
          : `লেনদেন পরিবর্তন প্রত্যাখ্যাত! এর ফলে আপনার অ্যাকাউন্টে ${currency}${formatNumber(proposedBalance, 'bn')} ঋণাত্মক ব্যালেন্স তৈরি হবে।`,
        type: 'warning'
      });
      setTimeout(() => setNotification(null), 6000);
      return;
    }

    // Check if any selected income gets fully spent
    if (type === 'expense' && linkedIncomeIds.length > 0) {
      const share = parsedAmount / linkedIncomeIds.length;
      const fullySpentIncomes: string[] = [];

      linkedIncomeIds.forEach(id => {
        const stats = incomeSourceStats[id];
        if (stats && stats.remaining - share <= 0.01) {
          const name = id === 'PRIOR_SAVINGS' ? (language === 'en' ? 'Prior Month Savings' : 'পূর্ববর্তী সঞ্চয়') : 
            (getLocalizedDescription(transactions.find(inc => inc.id === id)?.description || '', language) || (language === 'en' ? 'Income' : 'আয়'));
          fullySpentIncomes.push(name);
        }
      });

      if (fullySpentIncomes.length > 0) {
        setNotification({
          message: language === 'en' 
            ? `Notice: ${fullySpentIncomes.join(', ')} ${fullySpentIncomes.length > 1 ? 'have' : 'has'} been fully spent!`
            : `সতর্কতা: ${fullySpentIncomes.join(', ')} সম্পূর্ণ ব্যয় হয়ে গেছে!`,
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    }

    onUpdate(transaction.id, {
      amount: parsedAmount,
      category,
      customCategory: category === 'Other' ? customCategory : null,
      date,
      description: description || (category === 'Other' ? customCategory : category),
      type,
      linkedIncomeIds: type === 'expense' ? linkedIncomeIds : null
    });
  };

  const toggleIncomeSource = (id: string) => {
    setLinkedIncomeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{language === 'en' ? 'Edit Entry' : 'লেনদেন সংশোধন করুন'}</h3>
          <button onClick={onClose} className="text-muted hover:text-accent transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex p-1 glass rounded-xl">
            <button 
              type="button"
              onClick={() => {
                if (type !== 'expense') {
                  setType('expense');
                  setAmount('');
                  setCategory('');
                  setCustomCategory('');
                  setDescription('');
                  setLinkedIncomeIds([]);
                }
              }}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                type === 'expense' ? "bg-expense text-white shadow-lg shadow-expense/20" : "text-muted hover:text-accent"
              )}
            >
              {language === 'en' ? 'Expense' : 'ব্যয়'}
            </button>
            <button 
              type="button"
              onClick={() => {
                if (type !== 'income') {
                  setType('income');
                  setAmount('');
                  setCategory('');
                  setCustomCategory('');
                  setDescription('');
                  setLinkedIncomeIds([]);
                }
              }}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                type === 'income' ? "bg-income text-white shadow-lg shadow-income/20" : "text-muted hover:text-accent"
              )}
            >
              {language === 'en' ? 'Income' : 'আয়'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "col-span-full p-3 rounded-xl flex items-center gap-2 text-xs font-bold",
                  notification.type === 'warning' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                )}
              >
                <AlertCircle size={14} />
                {notification.message}
              </motion.div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                {language === 'en' ? `Amount (${currency})` : `পরিমাণ (${currency})`}
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[0-9.,০-৯]*$/.test(val)) {
                    setAmount(val);
                  }
                }}
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary placeholder:text-faint"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                {language === 'en' ? 'Date' : 'তারিখ'}
              </label>
              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder={language === 'en' ? "YYYY-MM-DD" : "বছর-মাস-দিন"}
                  value={language === 'bn' ? toBanglaNumerals(date) : date}
                  onChange={(e) => setDate(toEnglishNumerals(e.target.value))}
                  className="w-full bg-glass border border-glass-border rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-accent/40 text-primary font-semibold transition-all"
                  required
                />
                <div className="absolute left-4 text-accent pointer-events-none">
                  <Calendar size={16} />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="absolute right-3 p-1.5 rounded-lg hover:bg-white/5 text-accent transition-all duration-150 cursor-pointer"
                  title={language === 'en' ? "Open Calendar Picker" : "ক্যালেন্ডার খুলুন"}
                >
                  <Calendar size={16} />
                </button>
                {showCalendar && (
                  <div className="absolute top-full left-0 z-[999] mt-2">
                    <CalendarPicker
                      selectedDate={new Date(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date())}
                      language={language}
                      onSelect={(d) => {
                        if (d) {
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          setDate(`${yyyy}-${mm}-${dd}`);
                          setShowCalendar(false);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
              {language === 'en' ? 'Category' : 'ক্যাটাগরি'}
            </label>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 appearance-none pr-10 text-primary"
                required
              >
                <option value="" disabled className="bg-bg-deep">
                  {language === 'en' ? 'Select Category' : 'ক্যাটাগরি নির্বাচন করুন'}
                </option>
                {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat} className="bg-bg-deep">{getCategoryName(cat)}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-faint">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
          </div>

          {category === 'Other' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                {language === 'en' ? 'Custom Category Name' : 'কাস্টম ক্যাটাগরি নাম'}
              </label>
              <input 
                type="text"
                placeholder={language === 'en' ? "e.g., Gift, Bonus, etc." : "যেমন: উপহার, বোনাস ইত্যাদি"}
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary placeholder:text-faint"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
              {language === 'en' ? 'Description' : 'বিবরণ'}
            </label>
            <input 
              type="text"
              placeholder={language === 'en' ? "What was this for?" : "এটি কিসের জন্য ছিল?"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary placeholder:text-faint"
            />
          </div>

          {type === 'expense' && (incomeTransactions.length > 0 || effectivePreviousBalance > 0) && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1 flex justify-between">
                <span>{language === 'en' ? 'Spent from (Choose multiple)' : 'ব্যয়ের উৎস (একাধিক নির্বাচন করা যাবে)'}</span>
                {linkedIncomeIds.length > 0 && (
                  <span className="text-accent">
                    {language === 'en' ? `${linkedIncomeIds.length} selected` : `${linkedIncomeIds.length}টি নির্বাচিত`}
                  </span>
                )}
              </label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {effectivePreviousBalance > 0 && (() => {
                  const stats = incomeSourceStats['PRIOR_SAVINGS'] || { initial: 0, remaining: 0 };
                  const isSpent = stats.remaining <= 0;
                  const isSelected = linkedIncomeIds.includes('PRIOR_SAVINGS');
                  const spentAmount = stats.initial - stats.remaining;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpent && !isSelected) {
                          setNotification({
                            message: language === 'en'
                              ? "Prior Month Savings is already fully spent by other expenses."
                              : "পূর্ববর্তী মাসের সঞ্চয় ইতোমধ্যেই অন্যান্য ব্যয়ের মাধ্যমে সম্পূর্ণ খরচ হয়ে গেছে।",
                            type: 'warning'
                          });
                          setTimeout(() => setNotification(null), 4000);
                          return;
                        }
                        toggleIncomeSource('PRIOR_SAVINGS');
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                        isSelected
                          ? "bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(76,201,240,0.1)]"
                          : isSpent ? "bg-primary/5 border-glass-border opacity-50 cursor-pointer" : "bg-glass border-glass-border text-muted hover:border-accent/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          isSelected ? "bg-accent border-accent" : "border-faint"
                        )}>
                          {isSelected && <Check size={12} className="text-bg-deep" />}
                          {isSpent && !isSelected && <X size={10} className="text-rose-500 font-bold" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">
                            {language === 'en' ? 'Prior Month Savings' : 'পূর্ববর্তী মাসের সঞ্চয়'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] opacity-70">
                              {language === 'en' ? 'Spent:' : 'ব্যয়কৃত:'} {currency}{formatNumber(spentAmount, language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                            {isSpent && (
                              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter">
                                {language === 'en' ? 'Fully Spent' : 'সম্পূর্ণ শেষ'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono block">{currency}{formatNumber(Math.max(0, stats.remaining), language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] opacity-40">{language === 'en' ? 'remaining' : 'অবশিষ্ট'}</span>
                      </div>
                    </button>
                  );
                })()}
                {incomeTransactions.map(inc => {
                  const stats = incomeSourceStats[inc.id] || { initial: 0, remaining: 0 };
                  const isSpent = stats.remaining <= 0;
                  const isSelected = linkedIncomeIds.includes(inc.id);
                  const spentAmount = stats.initial - stats.remaining;
                  const incTitle = getLocalizedDescription(inc.description, language) || getCategoryName(inc.category);
                  return (
                    <button
                      key={inc.id}
                      type="button"
                      onClick={() => {
                        if (isSpent && !isSelected) {
                          setNotification({
                            message: language === 'en'
                              ? `"${incTitle}" is already fully spent by other expenses.`
                              : `"${incTitle}" ইতোমধ্যেই অন্যান্য ব্যয়ের মাধ্যমে সম্পূর্ণ খরচ হয়ে গেছে।`,
                            type: 'warning'
                          });
                          setTimeout(() => setNotification(null), 4000);
                          return;
                        }
                        toggleIncomeSource(inc.id);
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                        isSelected
                          ? "bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(76,201,240,0.1)]"
                          : isSpent ? "bg-primary/5 border-glass-border opacity-50 cursor-pointer" : "bg-glass border-glass-border text-muted hover:border-accent/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          isSelected ? "bg-accent border-accent" : "border-faint"
                        )}>
                          {isSelected && <Check size={12} className="text-bg-deep" />}
                          {isSpent && !isSelected && <X size={10} className="text-rose-500 font-bold" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate max-w-[150px]">{getLocalizedDescription(inc.description, language)}</span>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-[10px] opacity-60">{getCategoryName(inc.category)}</span>
                            <span className="text-[10px] text-sky-400/80 font-medium">
                              {language === 'en' ? 'Spent:' : 'ব্যয়কৃত:'} {currency}{formatNumber(spentAmount, language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                            {isSpent && (
                              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter">
                                {language === 'en' ? 'Fully Spent' : 'সম্পূর্ণ শেষ'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono block">{currency}{formatNumber(Math.max(0, stats.remaining), language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        <span className="text-[9px] opacity-40">{language === 'en' ? 'remaining' : 'অবশিষ্ট'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 glass rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
            >
              {language === 'en' ? 'Cancel' : 'বাতিল'}
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent/80 transition-colors"
            >
              {language === 'en' ? 'Update Entry' : 'হালনাগাদ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ConfirmModal({ 
  title, 
  message, 
  onConfirm, 
  onClose,
  isDanger = false,
  language = 'en'
}: { 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onClose: () => void;
  isDanger?: boolean;
  language?: LanguageType;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={cn("text-xl font-bold", isDanger ? "text-sky-400" : "text-primary")}>{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-accent transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-muted mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 glass rounded-xl text-sm font-bold hover:bg-accent/5 transition-colors"
          >
            {language === 'en' ? 'Cancel' : 'বাতিল'}
          </button>
          <button 
            onClick={onConfirm}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold shadow-lg transition-colors",
              isDanger 
                ? "bg-sky-500 text-white shadow-sky-900/20 hover:bg-sky-600" 
                : "bg-accent text-white shadow-accent/20 hover:bg-accent/80"
            )}
          >
            {language === 'en' ? 'Confirm' : 'নিশ্চিত করুন'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Onboarding({ 
  onComplete, 
  onSkip, 
  setActiveTab, 
  language = 'en' 
}: { 
  onComplete: () => void; 
  onSkip: () => void; 
  setActiveTab: (tab: any) => void; 
  language?: LanguageType 
}) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const steps = [
    {
      title: language === 'en' ? "Welcome to Digital Hishab!" : "স্বাগতম ডিজিটাল হিসাবে!",
      description: language === 'en' 
        ? "Welcome back! Let's take a comprehensive tour of your new financial command center. We've added powerful tools to help you master your money."
        : "স্বাগতম! চলুন আপনার নতুন আর্থিক হিসাব কেন্দ্রের একটি সংক্ষিপ্ত বিবরণ দেখে নেওয়া যাক। আপনার আর্থিক ব্যবস্থাপনাকে আরও সহজ করতে আমরা কিছু শক্তিশালী টুল যোগ করেছি।",
      icon: <Rocket size={48} className="text-accent" />,
      tab: 'overview',
      targetId: null
    },
    {
      title: language === 'en' ? "Tracking Your Wealth" : "আপনার সম্পদ ট্র্যাক করুন",
      description: language === 'en'
        ? "Your live balance is always visible here. It updates instantly whenever you record an income or expense."
        : "আপনার চলমান ব্যালেন্স সবসময় এখানে দৃশ্যমান থাকবে। কোনো আয় বা ব্যয় সংরক্ষণ করলেই এটি সাথে সাথে আপডেট হয়ে যাবে।",
      icon: <Wallet size={48} className="text-accent" />,
      tab: 'overview',
      targetId: 'header-balance-info'
    },
    {
      title: language === 'en' ? "The Golden Ratio" : "সঠিক অনুপাত",
      description: language === 'en'
        ? "Look at your new 'Net Savings' card. It perfectly balances your Total Income against Expenses, so you know exactly how much you're actually keeping."
        : "নতুন 'নিট সঞ্চয়' কার্ডটি দেখুন। এটি আপনার মোট আয় এবং ব্যয়ের মধ্যে নিখুঁত ভারসাম্য বজায় রাখে, যাতে আপনি ঠিক কত টাকা জমা করছেন তা জানতে পারেন।",
      icon: <Scale size={48} className="text-accent" />,
      tab: 'overview',
      targetId: 'sum-card-savings'
    },
    {
      title: language === 'en' ? "Time-Travel Filtering" : "নির্দিষ্ট সময়ের ফিল্টারিং",
      description: language === 'en'
        ? "You're no longer limited to the current week. Select any year or month. In 'Weekly' mode, you can even jump to a specific week of your choosing!"
        : "আপনি এখন আর নির্দিষ্ট সপ্তাহে সীমাবদ্ধ নন। যেকোনো বছর বা মাস নির্বাচন করতে পারেন। 'সাপ্তাহিক' মোডে আপনি আপনার পছন্দের সপ্তাহেও যেতে পারবেন!",
      icon: <Calendar size={48} className="text-accent" />,
      tab: 'overview',
      targetId: 'dashboard-filter-controls'
    },
    {
      title: language === 'en' ? "Quick Navigation" : "দ্রুত নেভিগেশন",
      description: language === 'en'
        ? "Use the sidebar to jump between features. Let's try adding a transaction now."
        : "বিভিন্ন ফিচারের মধ্যে যাতায়াত করতে সাইডবারটি ব্যবহার করুন। চলুন এখন একটি লেনদেন যোগ করার চেষ্টা করি।",
      icon: <Plus size={48} className="text-accent" />,
      tab: 'overview',
      targetId: 'tour-nav-add'
    },
    {
      title: language === 'en' ? "Audit-Ready History" : "লেনদেনের নির্ভরযোগ্য ইতিহাস",
      description: language === 'en'
        ? "Every taka recorded. Search by description, filter by category, or export everything to PDF/Excel for your records—instantly."
        : "প্রতিটি টাকার হিসাব সংরক্ষিত। বিবরণ দিয়ে অনুসন্ধান করুন, ক্যাটাগরি দিয়ে ফিল্টার করুন, অথবা তাত্ক্ষণিকভাবে আপনার যাবতীয় তথ্য পিডিএফ/এক্সেলে এক্সপোর্ট করুন।",
      icon: <History size={48} className="text-accent" />,
      tab: 'history',
      targetId: 'history-search-controls'
    },
    {
      title: language === 'en' ? "Visual Intelligence" : "গ্রাফিক্যাল এনালাইসিস",
      description: language === 'en'
        ? "Analyze your habits with high-precision charts. See your expense distribution and trends across any timeframe."
        : "উচ্চ-নির্ভুলতার চার্টের মাধ্যমে আপনার খরচ করার অভ্যাসগুলো বিশ্লেষণ করুন। যেকোনো সময়ের ট্রেন্ড ও ব্যয়ের অনুপাত সরাসরি দেখে নিন।",
      icon: <TrendingUp size={48} className="text-accent" />,
      tab: 'analytics',
      targetId: 'analytics-trend-chart'
    },
    {
      title: language === 'en' ? "Budget Mastery" : "বাজেটের নিয়ন্ত্রণ",
      description: language === 'en'
        ? "Set a healthy spending limit. We'll track your progress and alert you if you're stretching your budget too thin."
        : "একটি স্বাস্থ্যকর ব্যয়ের সীমা নির্ধারণ করে দিন। আমরা আপনার ব্যয়ের অগ্রগতি পর্যবেক্ষণ করব এবং বাজেট ছাড়িয়ে গেলে সতর্ক করব।",
      icon: <Target size={48} className="text-accent" />,
      tab: 'budget',
      targetId: 'tour-budget-card'
    },
    {
      title: language === 'en' ? "Ready to Start?" : "আপনি কি প্রস্তুত?",
      description: language === 'en'
        ? "You're all set! Start tracking your journey towards financial freedom today."
        : "সব তৈরি! আর্থিক স্বাধীনতার পথে আজই আপনার যাত্রা শুরু করুন।",
      icon: <Rocket size={48} className="text-accent" />,
      tab: 'overview',
      targetId: null
    }
  ];

  const getTargetElement = (targetId: string | null): HTMLElement | null => {
    if (!targetId || typeof document === 'undefined') return null;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (targetId === 'tour-nav-add') {
      const el = isMobile 
        ? (document.getElementById('mobile-nav-add') || document.getElementById('tour-nav-add'))
        : (document.getElementById('tour-nav-add') || document.getElementById('mobile-nav-add'));
      if (el && el.getBoundingClientRect().width > 0) return el;
      return null;
    }

    const el = document.getElementById(targetId);
    if (el && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0) {
      return el;
    }

    return null;
  };

  useEffect(() => {
    // Hide tooltip and spotlight while navigating/scrolling to new target
    setIsTooltipVisible(false);
    setSpotlightRect(null);

    // 1. Immediately switch tab so the target element begins mounting
    setActiveTab(steps[step].tab);

    let isMounted = true;
    let animFrame: number;
    let timerId: any;
    const targetId = steps[step].targetId;

    if (!targetId) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      timerId = setTimeout(() => {
        if (isMounted) setIsTooltipVisible(true);
      }, 200);
      return () => {
        isMounted = false;
        clearTimeout(timerId);
      };
    }

    // Attempt to locate, scroll into view, stabilize, and measure target
    const attemptLocateAndScroll = (attempt = 0, lastScrollY?: number, stableCount = 0) => {
      if (!isMounted) return;

      const el = getTargetElement(targetId);
      if (!el) {
        // Tab is still animating in via AnimatePresence mode="wait"
        if (attempt < 30) {
          timerId = setTimeout(() => attemptLocateAndScroll(attempt + 1), 50);
        }
        return;
      }

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      // Fixed nav elements (like mobile bottom bar or desktop sticky sidebar) don't need window scrolling
      const isFixedNav = targetId === 'tour-nav-add';

      // Safe viewport area taking into account top padding and mobile floating bottom nav
      const topSafe = isMobile ? 65 : 75;
      const bottomSafe = isMobile ? 90 : 35;
      const availableH = vh - topSafe - bottomSafe;

      // Check if element is already comfortably in view
      const isElementInView = isFixedNav || (
        rect.top >= topSafe &&
        (rect.height <= availableH ? rect.bottom <= (vh - bottomSafe) : rect.top <= topSafe + 25)
      );

      // If not in view and first attempt with element found, scroll smoothly
      if (!isElementInView && lastScrollY === undefined) {
        if (targetId === 'header-balance-info') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const docScrollY = window.scrollY;
          const elementAbsTop = docScrollY + rect.top;

          let desiredScrollY: number;
          if (rect.height <= availableH) {
            desiredScrollY = elementAbsTop - topSafe - Math.max(0, (availableH - rect.height) / 2);
          } else {
            desiredScrollY = elementAbsTop - topSafe;
          }

          window.scrollTo({
            top: Math.max(0, Math.round(desiredScrollY)),
            behavior: 'smooth'
          });
        }

        // Wait a beat before polling for scroll stability
        timerId = setTimeout(() => attemptLocateAndScroll(attempt + 1, window.scrollY, 0), 120);
        return;
      }

      // If a scroll was initiated, ensure the scroll has fully settled before revealing tooltip
      if (lastScrollY !== undefined) {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastScrollY) < 1.5) {
          stableCount++;
        } else {
          stableCount = 0;
        }

        if (stableCount < 2 && attempt < 25) {
          timerId = setTimeout(() => attemptLocateAndScroll(attempt + 1, currentScrollY, stableCount), 70);
          return;
        }
      }

      // Element is now stationary and fully in view! Measure exact bounding box
      const finalRect = el.getBoundingClientRect();
      if (finalRect.width > 0 && finalRect.height > 0) {
        setSpotlightRect({
          x: Math.round(finalRect.x),
          y: Math.round(finalRect.y),
          width: Math.round(finalRect.width),
          height: Math.round(finalRect.height)
        });
      }
      setIsTooltipVisible(true);
    };

    timerId = setTimeout(() => attemptLocateAndScroll(0), 40);

    const updateLive = () => {
      if (!isMounted) return;
      const el = getTargetElement(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSpotlightRect({
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      }
    };

    const handleUpdate = () => {
      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(updateLive);
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true, capture: true });

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, { capture: true });
    };
  }, [step]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  // Compute clean dialog card positioning that NEVER goes off-screen
  const cardStyle: React.CSSProperties = useMemo(() => {
    if (!spotlightRect || typeof window === 'undefined') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const isMobile = vw < 768;
    const tooltipHeight = isMobile ? 260 : 270;
    const bottomNavHeight = isMobile ? 85 : 20;

    const ringTop = spotlightRect.y - 8;
    const ringBottom = spotlightRect.y + spotlightRect.height + 8;

    const spaceAbove = ringTop;
    const spaceBelow = vh - ringBottom - (isMobile ? bottomNavHeight : 0);

    // Prefer positioning below the element if there is room
    if (spaceBelow >= tooltipHeight + 10) {
      return {
        top: `${Math.min(ringBottom + 12, vh - tooltipHeight - (isMobile ? bottomNavHeight : 16))}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    } 
    // Otherwise, position above the element if there is room
    else if (spaceAbove >= tooltipHeight + 10) {
      return {
        bottom: `${Math.min(vh - ringTop + 12, vh - tooltipHeight - 16)}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    } 
    // If element is very tall and neither side has full room:
    else {
      if (spotlightRect.y < vh / 3) {
        return {
          bottom: `${bottomNavHeight + 10}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      } else {
        return {
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      }
    }
  }, [spotlightRect]);

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Spotlight Overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[200]">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {isTooltipVisible && spotlightRect && (
              <rect
                x={spotlightRect.x - 8}
                y={spotlightRect.y - 8}
                width={spotlightRect.width + 16}
                height={spotlightRect.height + 16}
                rx={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.85)" 
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight Highlight Ring */}
      {isTooltipVisible && spotlightRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            opacity: 1,
            scale: 1,
            left: spotlightRect.x - 8,
            top: spotlightRect.y - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed pointer-events-none rounded-2xl border-2 border-accent shadow-[0_0_25px_var(--accent-glow)] z-[201]"
        />
      )}

      {/* Instruction Card */}
      <AnimatePresence>
        {isTooltipVisible && (
          <div 
            className="fixed z-[210] p-4 pointer-events-none w-full max-w-sm"
            style={cardStyle}
          >
            <motion.div 
              key={step}
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="glass-card w-full p-6 sm:p-7 text-center pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-glass-border/80 backdrop-blur-3xl"
            >
              <div className="mb-5 flex justify-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  className="p-3.5 rounded-2xl bg-accent/10 border border-accent/20"
                >
                  {steps[step].icon}
                </motion.div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold mb-2 text-primary">{steps[step].title}</h3>
              <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
                {steps[step].description}
              </p>

              <div className="flex gap-2.5">
                <button 
                  type="button"
                  onClick={onSkip}
                  className="flex-1 py-2.5 glass rounded-xl text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Skip' : 'এড়িয়ে যান'}
                </button>
                <button 
                  type="button"
                  onClick={handleNext}
                  className="flex-[2] py-2.5 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-accent/20 hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {step === steps.length - 1 
                    ? (language === 'en' ? "Get Started" : "শুরু করুন") 
                    : (language === 'en' ? "Next Step" : "পরবর্তী ধাপ")} <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex justify-center gap-1.5 mt-6">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === step ? "w-6 bg-accent" : "w-1.5 bg-white/10"
                    )} 
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const compressImage = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

function ProfileModal({ 
  type, 
  onClose, 
  userEmail, 
  userDisplayName, 
  setUserDisplayName,
  userPhotoURL,
  setUserPhotoURL,
  userGender,
  setUserGender,
  language = 'en'
}: { 
  type: 'name' | 'password'; 
  onClose: () => void; 
  userEmail: string;
  userDisplayName: string;
  setUserDisplayName: (name: string) => void;
  userPhotoURL: string;
  setUserPhotoURL: (url: string) => void;
  userGender: string;
  setUserGender: (gender: any) => void;
  language?: LanguageType;
}) {
  const [name, setName] = useState(userDisplayName);
  const [gender, setGender] = useState(userGender);
  const [photoURL, setPhotoURL] = useState(userPhotoURL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError(language === 'en' ? 'Image must be less than 5MB' : 'ছবি অবশ্যই ৫ মেগাবাইটের কম হতে হবে');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadstart = () => setIsUploading(true);
    reader.onloadend = async () => {
      try {
        const base64Raw = reader.result as string;
        const compressed = await compressImage(base64Raw, 400, 400);
        setPhotoURL(compressed);
        setError('');
      } catch (err) {
        console.error("Image compression error:", err);
        setError(language === 'en' ? 'Error processing the image' : 'ছবি প্রক্রিয়াকরণ করতে সমস্যা হয়েছে');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (type === 'name' && !name.trim()) {
      setError(language === 'en' ? 'Name cannot be empty' : 'নাম খালি রাখা যাবে না');
      return;
    }
    if (type === 'password' && !password.trim()) {
      setError(language === 'en' ? 'Password cannot be empty' : 'পাসওয়ার্ড খালি রাখা যাবে না');
      return;
    }

    if (!auth.currentUser) return;

    try {
      if (type === 'name') {
        await updateProfile(auth.currentUser, { 
          displayName: name.trim()
        });
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
          displayName: name.trim(),
          gender: gender,
          photoURL: photoURL
        });
        setUserDisplayName(name.trim());
        setUserGender(gender);
        setUserPhotoURL(photoURL);
      } else {
        if (password.length < 8) {
          setError(language === 'en' ? 'Password must be at least 8 characters' : 'পাসওয়ার্ড অবশ্যই কমপক্ষে ৮ অক্ষরের হতে হবে');
          return;
        }
        await updatePassword(auth.currentUser, password);
      }
      onClose();
    } catch (error: any) {
      console.error("Profile Update Error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setError(language === 'en' ? 'Please log out and log in again to change sensitive info.' : 'সংবেদনশীল তথ্য পরিবর্তনের জন্য অনুগ্রহ করে একবার লগ আউট করে পুনরায় লগইন করুন।');
      } else {
        setError(error.message || (language === 'en' ? 'Failed to update profile.' : 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।'));
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-md p-6 sm:p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            {type === 'name' 
              ? (language === 'en' ? 'Update Profile' : 'প্রোফাইল আপডেট করুন') 
              : (language === 'en' ? 'Change Password' : 'পাসওয়ার্ড পরিবর্তন করুন')}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {type === 'name' ? (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-accent/20 bg-glass flex items-center justify-center relative">
                    {photoURL ? (
                      <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={40} className="text-faint" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <RefreshCcw className="animate-spin text-white" size={20} />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-accent text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera size={14} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-faint mt-3">
                  {language === 'en' ? 'Profile Picture' : 'প্রোফাইল ছবি'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                  {language === 'en' ? 'Display Name' : 'প্রদর্শিত নাম'}
                </label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder={language === 'en' ? "Enter name" : "নাম লিখুন"}
                  className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                  {language === 'en' ? 'Gender' : 'লিঙ্গ'}
                </label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 appearance-none text-primary"
                >
                  <option value="" disabled className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Select Gender' : 'লিঙ্গ নির্বাচন করুন'}
                  </option>
                  <option value="Male" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Male' : 'পুরুষ'}
                  </option>
                  <option value="Female" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Female' : 'নারী'}
                  </option>
                  <option value="Other" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Other' : 'অন্যান্য'}
                  </option>
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-faint ml-1">
                {language === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'}
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full bg-glass border border-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 text-primary"
                autoFocus
              />
            </div>
          )}
          
          {error && <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest ml-1">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3 glass rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
            >
              {language === 'en' ? 'Cancel' : 'বাতিল'}
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent/80 transition-colors"
            >
              {language === 'en' ? 'Save Changes' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NotificationCentre({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkRead, 
  onMarkAllRead,
  onDelete,
  onClearAll,
  language = 'en'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  notifications: AppNotification[]; 
  onMarkRead: (id: string) => void; 
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  language?: LanguageType;
}) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const unreadCount = notifications.filter(n => !n.read).length;

  const displayedNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const formatRelativeTime = (timestamp: number, lang: LanguageType = 'en') => {
    if (!timestamp) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 60) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return lang === 'bn' ? `${toBanglaNumerals(String(diffMin))} মিনিট আগে` : `${diffMin}m ago`;
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return lang === 'bn' ? `${toBanglaNumerals(String(diffHours))} ঘণ্টা আগে` : `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return lang === 'bn' ? `${toBanglaNumerals(String(diffDays))} দিন আগে` : `${diffDays}d ago`;
    }
    return new Date(timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-xs"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -16, x: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16, x: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-20 sm:top-24 right-4 sm:right-8 z-[160] w-[calc(100vw-32px)] sm:w-[410px] bg-[var(--bg-deep)] border border-glass-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[82vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-glass-border/30 bg-glass/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-primary">
                      {language === 'en' ? 'Notifications' : 'বিজ্ঞপ্তিসমূহ'}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/30">
                        {language === 'bn' ? `${toBanglaNumerals(String(unreadCount))} নতুন` : `${unreadCount} new`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    {language === 'en' ? 'Alerts and transaction activity' : 'সতর্কবার্তা ও লেনদেনের হালনাগাদ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={onClose} 
                  className="p-2 rounded-xl text-faint hover:text-primary hover:bg-glass transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Subheader Controls: Filter & Actions */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-glass-border/20 bg-glass/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-0.5 bg-black/10 dark:bg-white/5 rounded-xl border border-glass-border/30">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    "px-3 py-1 text-[11px] font-semibold rounded-lg transition-all",
                    filter === 'all' 
                      ? "bg-accent text-white shadow-sm" 
                      : "text-muted hover:text-primary"
                  )}
                >
                  {language === 'en' ? 'All' : 'সব'} ({language === 'bn' ? toBanglaNumerals(String(notifications.length)) : notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={cn(
                    "px-3 py-1 text-[11px] font-semibold rounded-lg transition-all",
                    filter === 'unread' 
                      ? "bg-accent text-white shadow-sm" 
                      : "text-muted hover:text-primary"
                  )}
                >
                  {language === 'en' ? 'Unread' : 'অপঠিত'} ({language === 'bn' ? toBanglaNumerals(String(unreadCount)) : unreadCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={onMarkAllRead}
                    className="text-[11px] font-bold text-accent hover:underline transition-all"
                  >
                    {language === 'en' ? 'Mark all read' : 'সব পঠিত করুন'}
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={onClearAll}
                    className="text-[11px] font-semibold text-faint hover:text-rose-400 transition-colors"
                  >
                    {language === 'en' ? 'Clear all' : 'সব মুছুন'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-glass-border/20 p-2 sm:p-3 space-y-1">
              {displayedNotifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-glass border border-glass-border/40 flex items-center justify-center mb-3 text-muted">
                    <CheckCircle2 size={28} className="text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-primary mb-1">
                    {filter === 'unread' 
                      ? (language === 'en' ? 'No unread notifications' : 'কোনো অপঠিত বিজ্ঞপ্তি নেই')
                      : (language === 'en' ? 'All caught up!' : 'নতুন কোনো বিজ্ঞপ্তি নেই!')}
                  </p>
                  <p className="text-xs text-muted max-w-[220px]">
                    {language === 'en' 
                      ? 'Budget limits and transaction logs will appear here.'
                      : 'বাজেটের সতর্কতা এবং লেনদেনের তথ্য এখানে প্রদর্শিত হবে।'}
                  </p>
                </div>
              ) : (
                displayedNotifications.map((n) => {
                  const isWarning = n.type === 'warning' || n.type === 'alert';
                  const isSuccess = n.type === 'success';

                  return (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        if (!n.read) onMarkRead(n.id);
                      }}
                      className={cn(
                        "p-3.5 rounded-2xl transition-all relative group cursor-pointer border",
                        n.read 
                          ? "bg-glass/20 border-transparent hover:bg-glass/40 hover:border-glass-border/30" 
                          : "bg-accent/[0.06] border-accent/25 hover:bg-accent/[0.09]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2.5 rounded-xl shrink-0 border",
                          isWarning ? "bg-amber-500/10 border-amber-500/25 text-amber-400" :
                          isSuccess ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" :
                          "bg-sky-500/10 border-sky-500/25 text-sky-400"
                        )}>
                          {isWarning ? <AlertCircle size={17} /> :
                           isSuccess ? <CheckCircle2 size={17} /> :
                           <Info size={17} />}
                        </div>

                        <div className="min-w-0 flex-1 pr-6">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              "text-sm font-bold truncate",
                              n.read ? "text-primary/90" : "text-primary"
                            )}>
                              {language === 'bn' ? (n.titleBn || n.title) : n.title}
                            </h4>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(76,201,240,0.8)] shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-muted leading-relaxed mb-2.5 break-words">
                            {language === 'bn' ? (n.messageBn || n.message) : n.message}
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-medium text-faint">
                            <span>
                              {formatRelativeTime(n.timestamp, language)}
                            </span>
                            {!n.read && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkRead(n.id);
                                }}
                                className="text-accent hover:underline font-bold uppercase tracking-wider text-[9px]"
                              >
                                {language === 'en' ? 'Mark read' : 'পঠিত'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dismiss single button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(n.id);
                          }}
                          title={language === 'en' ? 'Dismiss' : 'মুছুন'}
                          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-faint opacity-60 hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


