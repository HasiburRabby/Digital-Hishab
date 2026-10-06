import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Search, 
  ArrowRightLeft, 
  Navigation, 
  Clock, 
  Phone, 
  ExternalLink, 
  RefreshCw, 
  Coins, 
  Layers, 
  Map as MapIcon, 
  List, 
  Building2, 
  Share2, 
  Check, 
  Compass, 
  TrendingUp, 
  Info, 
  DollarSign, 
  Globe,
  Loader2,
  X,
  MapPinned,
  History,
  Maximize2,
  Minimize2,
  Trash2,
  ChevronDown
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LanguageType } from '../translations';
import { cn } from '../lib/utils';

export interface CurrencyShop {
  id: string;
  name: string;
  nameBn: string;
  address: string;
  addressBn: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
  hoursBn?: string;
  isOpen?: boolean;
  rateSpreadModifier: number;
  badges: string[];
  badgesBn: string[];
  website?: string;
  osmType?: string;
  osmId?: string | number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  nameBn: string;
  symbol: string;
  flag: string;
}

export const POPULAR_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', nameBn: 'মার্কিন ডলার', symbol: '$', flag: '🇺🇸' },
  { code: 'BDT', name: 'Bangladeshi Taka', nameBn: 'বাংলাদেশী টাকা', symbol: '৳', flag: '🇧🇩' },
  { code: 'EUR', name: 'Euro', nameBn: 'ইউরো', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', nameBn: 'ব্রিটিশ পাউন্ড', symbol: '£', flag: '🇬🇧' },
  { code: 'SAR', name: 'Saudi Riyal', nameBn: 'সৌদি রিয়াল', symbol: '﷼', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', nameBn: 'ইউএই দিরহাম', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'INR', name: 'Indian Rupee', nameBn: 'ভারতীয় রুপি', symbol: '₹', flag: '🇮🇳' },
  { code: 'CAD', name: 'Canadian Dollar', nameBn: 'কানাডিয়ান ডলার', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', nameBn: 'অস্ট্রেলিয়ান ডলার', symbol: 'A$', flag: '🇦🇺' },
  { code: 'SGD', name: 'Singapore Dollar', nameBn: 'সিঙ্গাপুর ডলার', symbol: 'S$', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameBn: 'মালয়েশিয়ান রিঙ্গিত', symbol: 'RM', flag: '🇲🇾' },
  { code: 'JPY', name: 'Japanese Yen', nameBn: 'জাপানি ইয়েন', symbol: '¥', flag: '🇯🇵' },
  { code: 'THB', name: 'Thai Baht', nameBn: 'থাই বাত', symbol: '฿', flag: '🇹🇭' }
];

// Fallback baseline interbank market rates against USD in case offline
const BASE_MARKET_RATES: Record<string, number> = {
  USD: 1.0,
  BDT: 121.85,
  EUR: 0.92,
  GBP: 0.785,
  SAR: 3.75,
  AED: 3.67,
  INR: 86.80,
  CAD: 1.38,
  AUD: 1.52,
  SGD: 1.34,
  MYR: 4.42,
  JPY: 153.20,
  THB: 35.60
};

export interface RecentSearchItem {
  name: string;
  lat: number;
  lng: number;
}

// Calculate Haversine distance in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distanceKm: number, language: string = 'en'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return language === 'en' ? `${meters} m` : `${meters} মিটার`;
  }
  return language === 'en' ? `${distanceKm.toFixed(1)} km` : `${distanceKm.toFixed(1)} কিমি`;
}

interface NearbyCurrencyExchangeProps {
  language?: LanguageType;
  currency?: string;
  onAddTransaction?: (transaction: {
    amount: number;
    category: string;
    date: string;
    description: string;
    type: 'income' | 'expense';
  }) => void;
  className?: string;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (fullscreen: boolean) => void;
}

interface SelectedShopSlipProps {
  selectedShop: CurrencyShop;
  activeCenter: { lat: number; lng: number };
  selectedShopRate: number;
  calculatedPayout: number;
  exchangeAmount: number;
  fromCurrency: string;
  toCurrency: string;
  fromCurrencyObj: CurrencyInfo;
  toCurrencyObj: CurrencyInfo;
  language: LanguageType;
  copiedQuote: boolean;
  handleCopyQuote: () => void;
  onAddTransaction?: (transaction: {
    amount: number;
    category: string;
    date: string;
    description: string;
    type: 'income' | 'expense';
  }) => void;
  recordedSuccess: boolean;
  handleRecordTransaction: () => void;
  onViewOnMap?: () => void;
  onCloseSlip?: () => void;
}

const SelectedShopSlip: React.FC<SelectedShopSlipProps> = ({
  selectedShop,
  activeCenter,
  selectedShopRate,
  calculatedPayout,
  exchangeAmount,
  fromCurrency,
  toCurrency,
  fromCurrencyObj,
  toCurrencyObj,
  language,
  copiedQuote,
  handleCopyQuote,
  onAddTransaction,
  recordedSuccess,
  handleRecordTransaction,
  onViewOnMap,
  onCloseSlip
}) => {
  return (
    <div className="glass-card p-3.5 sm:p-5 rounded-2xl border border-accent/40 bg-gradient-to-br from-glass/95 via-glass to-bg-deep/90 space-y-3 sm:space-y-4 shadow-xl relative">
      {onCloseSlip && (
        <button
          type="button"
          onClick={onCloseSlip}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted hover:text-primary hover:bg-glass/80 transition-colors z-10 cursor-pointer"
          title={language === 'en' ? 'Close detail' : 'বন্ধ করুন'}
          aria-label="Close detail"
        >
          <X size={15} />
        </button>
      )}

      {/* Counter Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 border-b border-glass-border/40 pb-2.5 sm:pb-3 pr-6 sm:pr-0">
        <div className="min-w-0 w-full sm:w-auto">
          <span className="text-[10px] text-accent uppercase font-bold tracking-wider block">
            {language === 'en' ? 'Selected Exchange Counter' : 'নির্বাচিত এক্সচেঞ্জ কাউন্টার'}
          </span>
          <h4 className="text-sm sm:text-lg font-black text-primary flex items-center gap-1.5 sm:gap-2 flex-wrap mt-0.5">
            <span className="truncate">{language === 'en' ? selectedShop.name : selectedShop.nameBn}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-accent/15 text-accent border border-accent/30 shrink-0">
              {selectedShop.osmType ? selectedShop.osmType.replace('_', ' ') : 'OSM'}
            </span>
          </h4>
          <p className="text-[11px] sm:text-xs text-muted mt-0.5 truncate">
            {language === 'en' ? selectedShop.address : selectedShop.addressBn}
            {selectedShop.phone ? ` • 📞 ${selectedShop.phone}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
          {/* Directions Link */}
          <a
            href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${activeCenter.lat}%2C${activeCenter.lng}%3B${selectedShop.lat}%2C${selectedShop.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-accent text-white text-[11px] sm:text-xs font-bold hover:brightness-110 flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap min-h-[38px]"
          >
            <Navigation size={12} className="shrink-0" />
            <span>{language === 'en' ? 'Directions' : 'দিকনির্দেশনা'}</span>
            <ExternalLink size={10} className="shrink-0" />
          </a>

          {/* View on Map button */}
          {onViewOnMap && (
            <button
              type="button"
              onClick={onViewOnMap}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-accent/15 text-accent text-[11px] sm:text-xs font-bold hover:bg-accent hover:text-white flex items-center justify-center gap-1.5 border border-accent/30 transition-colors shrink-0 min-h-[38px] cursor-pointer"
              title={language === 'en' ? 'View on Map' : 'ম্যাপে দেখুন'}
            >
              <MapIcon size={12} className="shrink-0" />
              <span>{language === 'en' ? 'On Map' : 'ম্যাপে'}</span>
            </button>
          )}

          {/* Call Shop */}
          {selectedShop.phone ? (
            <a
              href={`tel:${selectedShop.phone}`}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-glass text-primary text-[11px] sm:text-xs font-bold hover:border-accent/40 flex items-center justify-center gap-1.5 border border-glass-border transition-colors shrink-0 min-h-[38px]"
              title={language === 'en' ? `Call ${selectedShop.phone}` : `কল করুন`}
            >
              <Phone size={12} className="shrink-0" />
              <span>{language === 'en' ? 'Call' : 'কল'}</span>
            </a>
          ) : null}

          {/* Copy Quote */}
          <button
            type="button"
            onClick={handleCopyQuote}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-glass text-primary text-[11px] sm:text-xs font-bold hover:border-accent/40 flex items-center justify-center gap-1.5 border border-glass-border transition-colors shrink-0 min-h-[38px] cursor-pointer"
            title={language === 'en' ? 'Share quote' : 'শেয়ার করুন'}
          >
            {copiedQuote ? <Check size={12} className="text-income shrink-0" /> : <Share2 size={12} className="shrink-0" />}
            <span>{copiedQuote ? (language === 'en' ? 'Copied' : 'কপি') : (language === 'en' ? 'Share' : 'শেয়ার')}</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards with Clear Financial Typography */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 rounded-xl bg-bg-deep/60 border border-glass-border/60">
          <span className="text-[10px] text-muted uppercase font-bold block">
            {language === 'en' ? 'Exchanging' : 'বিনিময় করছেন'}
          </span>
          <div className="text-sm sm:text-base font-black text-primary mt-0.5 truncate tabular-nums">
            {exchangeAmount.toLocaleString()} {fromCurrency}
          </div>
          <span className="text-[10px] text-muted block mt-0.5 truncate">
            {fromCurrencyObj.name}
          </span>
        </div>

        <div className="p-2 sm:p-3 rounded-xl bg-bg-deep/60 border border-glass-border/60">
          <span className="text-[10px] text-muted uppercase font-bold block">
            {language === 'en' ? 'Exchange Rate' : 'এক্সচেঞ্জ রেট'}
          </span>
          <div className="text-sm sm:text-base font-black text-income mt-0.5 truncate tabular-nums">
            1 {fromCurrency} = {selectedShopRate.toFixed(4)} {toCurrency}
          </div>
          <span className="text-[10px] text-muted block mt-0.5 truncate">
            {language === 'en' ? 'Counter Rate' : 'কাউন্টার রেট'}
          </span>
        </div>

        <div className="p-2 sm:p-3 rounded-xl bg-income/10 border border-income/30">
          <span className="text-[10px] text-income uppercase font-black block">
            {language === 'en' ? 'Net You Receive' : 'মোট পাবেন'}
          </span>
          <div className="text-base sm:text-xl font-black text-income mt-0.5 truncate tabular-nums">
            {calculatedPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrencyObj.symbol}
          </div>
          <span className="text-[10px] text-income block mt-0.5 font-bold">
            {language === 'en' ? '✓ Transparent Calculation' : '✓ স্বচ্ছ রূপান্তর'}
          </span>
        </div>
      </div>

      {/* Record to Transaction ledger */}
      {onAddTransaction && (
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-glass-border/30">
          <div className="text-[11px] sm:text-xs text-muted">
            {language === 'en' 
              ? 'Completed this exchange? Record it directly into your Digital Hishab.' 
              : 'বিনিময় সম্পন্ন হলে সরাসরি আপনার ডিজিটাল হিসাবে লেনদেন যুক্ত করুন।'}
          </div>
          <button
            type="button"
            onClick={handleRecordTransaction}
            disabled={recordedSuccess}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 min-h-[38px] cursor-pointer",
              recordedSuccess 
                ? "bg-income text-white" 
                : "bg-income/20 text-income hover:bg-income hover:text-white border border-income/40"
            )}
          >
            {recordedSuccess ? <Check size={14} /> : <DollarSign size={14} />}
            <span>
              {recordedSuccess 
                ? (language === 'en' ? 'Recorded to Hishab!' : 'হিসাবে যুক্ত হয়েছে!') 
                : (language === 'en' ? 'Save as Transaction' : 'লেনদেনে সংরক্ষণ')}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export const NearbyCurrencyExchange: React.FC<NearbyCurrencyExchangeProps> = ({
  language = 'en',
  currency = 'BDT',
  onAddTransaction,
  className,
  onClose,
  isFullscreen,
  onToggleFullscreen
}) => {
  // Location States - Neutral default center (Bangladesh geographic center)
  const [activeCenter, setActiveCenter] = useState<{ lat: number; lng: number }>({ lat: 23.6850, lng: 90.3563 });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fullscreen state
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const isFullscreenActive = isFullscreen !== undefined ? isFullscreen : isMapFullscreen;

  const toggleFullscreen = useCallback(() => {
    const nextVal = !isFullscreenActive;
    setIsMapFullscreen(nextVal);
    if (onToggleFullscreen) {
      onToggleFullscreen(nextVal);
    }
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 100);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 300);
  }, [isFullscreenActive, onToggleFullscreen]);

  // Sync with isFullscreen prop
  useEffect(() => {
    if (isFullscreen !== undefined && isFullscreen !== isMapFullscreen) {
      setIsMapFullscreen(isFullscreen);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [isFullscreen]);

  // Escape key listener for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenActive) {
        setIsMapFullscreen(false);
        if (onToggleFullscreen) onToggleFullscreen(false);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenActive, onToggleFullscreen]);

  // Search tracking: shops only load after an explicit search or GPS click
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Location Search & Autocomplete
  const [locationSearchInput, setLocationSearchInput] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Recent searches saved locally (replaces all static demo hubs)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hishab_forex_recent_searches');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });

  const saveRecentSearch = (name: string, lat: number, lng: number) => {
    const item: RecentSearchItem = { name, lat, lng };
    setRecentSearches(prev => {
      const filtered = prev.filter(p => Math.abs(p.lat - lat) > 0.005 || Math.abs(p.lng - lng) > 0.005);
      const updated = [item, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('hishab_forex_recent_searches', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const handleDeleteRecentSearch = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      try {
        localStorage.setItem('hishab_forex_recent_searches', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const handleClearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('hishab_forex_recent_searches');
    } catch (_) {}
  };

  // Live Exchange Rates State (Real Forex API)
  const [liveRates, setLiveRates] = useState<Record<string, number>>(BASE_MARKET_RATES);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>('Real-time');
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);

  // Currency Selection & Calculator States
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>(currency === '$' ? 'BDT' : currency === '৳' ? 'BDT' : currency || 'BDT');
  const [exchangeAmount, setExchangeAmount] = useState<number>(100);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // Real OpenStreetMap Shops (strictly empty initially until user searches)
  const [shops, setShops] = useState<CurrencyShop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(false);

  // View & Filter States - Default to 'list' on mobile (< 768px) and 'split' on desktop
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'list';
    }
    return 'split';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'distance' | 'rate'>('distance');
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);
  const [recordedSuccess, setRecordedSuccess] = useState<boolean>(false);

  // Pure OpenStreetMap + Leaflet Tile Layer
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Leaflet map instances
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch real live forex market rates
  const fetchLiveRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setLiveRates(data.rates);
          if (data.time_last_update_utc) {
            const date = new Date(data.time_last_update_utc);
            setRatesLastUpdated(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (e) {
      console.warn('Using baseline interbank rates', e);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveRates();
  }, [fetchLiveRates]);

  // Compute Base Market Rate for the pair using live rates
  const baseRate = useMemo(() => {
    const fromBase = liveRates[fromCurrency] || BASE_MARKET_RATES[fromCurrency] || 1.0;
    const toBase = liveRates[toCurrency] || BASE_MARKET_RATES[toCurrency] || 1.0;
    return toBase / fromBase;
  }, [fromCurrency, toCurrency, liveRates]);

  // Fetch REAL OpenStreetMap Currency Exchange Shops strictly for the searched coordinates
  const fetchRealShops = useCallback(async (lat: number, lng: number, placeContextName?: string) => {
    setIsLoadingShops(true);
    try {
      const places: any[] = [];
      const seen = new Set<string>();

      // 1. Query Photon OpenStreetMap API around coordinates for money exchange & bureau de change
      try {
        const [resExchange, resBureau] = await Promise.all([
          fetch(`https://photon.komoot.io/api/?q=money+exchange&lat=${lat}&lon=${lng}&limit=15`),
          fetch(`https://photon.komoot.io/api/?q=bureau+de+change&lat=${lat}&lon=${lng}&limit=10`)
        ]);

        if (resExchange.ok) {
          const data = await resExchange.json();
          if (data && Array.isArray(data.features)) {
            places.push(...data.features);
          }
        }
        if (resBureau.ok) {
          const data = await resBureau.json();
          if (data && Array.isArray(data.features)) {
            places.push(...data.features);
          }
        }
      } catch (e) {
        console.warn('Photon query issue, falling back...', e);
      }

      // If under 3 results, also query currency exchange / forex
      if (places.length < 3) {
        try {
          const resForex = await fetch(`https://photon.komoot.io/api/?q=currency+exchange&lat=${lat}&lon=${lng}&limit=10`);
          if (resForex.ok) {
            const data = await resForex.json();
            if (data && Array.isArray(data.features)) {
              places.push(...data.features);
            }
          }
        } catch (_) {}
      }

      // Map GeoJSON features to CurrencyShop with strict distance check (within 35 km)
      const mappedShops: CurrencyShop[] = [];
      const MAX_RADIUS_KM = 35;

      for (const feat of places) {
        if (!feat || !feat.geometry || !Array.isArray(feat.geometry.coordinates)) continue;
        const shopLng = feat.geometry.coordinates[0];
        const shopLat = feat.geometry.coordinates[1];
        if (typeof shopLat !== 'number' || typeof shopLng !== 'number') continue;

        const prop = feat.properties || {};
        const key = prop.osm_id ? `${prop.osm_type || 'N'}-${prop.osm_id}` : `${shopLat.toFixed(5)}-${shopLng.toFixed(5)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const dist = calculateHaversineDistance(lat, lng, shopLat, shopLng);
        // STRICT DISTANCE CHECK: Must be genuinely near the searched location (within 35 km)
        if (dist > MAX_RADIUS_KM) continue;

        const rawName = prop.name || (prop.osm_value ? `${prop.osm_value.replace(/_/g, ' ').toUpperCase()} #${prop.osm_id}` : 'Money Exchange Counter');
        const addrParts = [
          prop.housenumber ? `${prop.housenumber} ${prop.street || ''}`.trim() : prop.street,
          prop.locality,
          prop.district,
          prop.city,
          prop.state,
          prop.country
        ].filter(Boolean);
        const fullAddr = addrParts.join(', ') || prop.country || 'Nearby Financial Area';

        // Real badges derived from actual OpenStreetMap properties
        const realBadges: string[] = [];
        const realBadgesBn: string[] = [];
        if (prop.osm_value === 'bureau_de_change' || prop.osm_key === 'bureau_de_change') {
          realBadges.push('Bureau De Change');
          realBadgesBn.push('মুদ্রা বিনিময় কেন্দ্র');
        } else if (prop.osm_value === 'money_transfer') {
          realBadges.push('Money Transfer');
          realBadgesBn.push('মানি ট্রান্সফার');
        } else if (prop.osm_value === 'bank' || prop.osm_key === 'bank') {
          realBadges.push('Bank Exchange Desk');
          realBadgesBn.push('ব্যাংক এক্সচেঞ্জ ডেস্ক');
        } else {
          realBadges.push('Foreign Exchange');
          realBadgesBn.push('বৈদেশিক মুদ্রা বিনিময়');
        }

        if (prop.postcode) {
          realBadges.push(`Postal ${prop.postcode}`);
          realBadgesBn.push(`পোস্টাল ${prop.postcode}`);
        }

        mappedShops.push({
          id: `osm-${prop.osm_id || key}`,
          name: rawName,
          nameBn: rawName,
          address: fullAddr,
          addressBn: fullAddr,
          lat: shopLat,
          lng: shopLng,
          phone: undefined,
          hours: undefined,
          hoursBn: undefined,
          isOpen: true,
          rateSpreadModifier: 0.003,
          badges: realBadges,
          badgesBn: realBadgesBn,
          osmType: prop.osm_value || prop.osm_key || 'bureau_de_change',
          osmId: prop.osm_id
        });
      }

      // Sort by distance ascending (nearest first)
      mappedShops.sort((a, b) => {
        const distA = calculateHaversineDistance(lat, lng, a.lat, a.lng);
        const distB = calculateHaversineDistance(lat, lng, b.lat, b.lng);
        return distA - distB;
      });

      setShops(mappedShops);
      if (mappedShops.length > 0) {
        setSelectedShopId(mappedShops[0].id);
      } else {
        setSelectedShopId(null);
      }
    } catch (err) {
      console.error('Failed to load real OpenStreetMap shops:', err);
    } finally {
      setIsLoadingShops(false);
    }
  }, []);

  // Autocomplete / Search location with Photon OpenStreetMap API
  const searchLocationQuery = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.features)) {
          const suggestions = data.features.map((f: any) => {
            const p = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const name = p.name || p.street || p.city || query;
            const fullDisp = [p.name, p.street, p.locality, p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
            return {
              place_id: p.osm_id || `${coords[1]}-${coords[0]}`,
              name,
              display_name: fullDisp || name,
              lat: coords[1],
              lon: coords[0]
            };
          });
          setLocationSuggestions(suggestions);
          setShowLocationDropdown(true);
        }
      }
    } catch (e) {
      console.warn('Location query error', e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Debounced input search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearchInput.trim() && showLocationDropdown) {
        searchLocationQuery(locationSearchInput);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [locationSearchInput, showLocationDropdown]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selecting a location suggestion
  const handleSelectLocation = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const name = place.name || place.display_name.split(',')[0];
    const fullDisp = place.display_name.split(',').slice(0, 3).join(', ');
    const chosenName = fullDisp || name;

    setActiveCenter({ lat, lng });
    setLocationName(chosenName);
    setLocationSearchInput(chosenName);
    setShowLocationDropdown(false);
    setUserLocation(null);
    setLocationError(null);
    setHasSearched(true);

    saveRecentSearch(name, lat, lng);

    // Pan map to searched coordinates
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
    }

    fetchRealShops(lat, lng, chosenName);
  };

  // Submit search on Enter key or button click
  const handleSubmitLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!locationSearchInput.trim()) return;

    setIsSearchingLocation(true);
    setLocationError(null);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationSearchInput)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.features) && data.features.length > 0) {
          const f = data.features[0];
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          const name = p.name || p.street || p.city || locationSearchInput;
          const fullDisp = [p.name, p.street, p.locality, p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
          handleSelectLocation({
            place_id: p.osm_id,
            name,
            display_name: fullDisp || name,
            lat: coords[1],
            lon: coords[0]
          });
        } else {
          setLocationError(language === 'en' ? 'Location not found. Please try another place.' : 'স্থানটি খুঁজে পাওয়া যায়নি। অন্য স্থান লিখে খুঁজুন।');
        }
      }
    } catch (err) {
      setLocationError(language === 'en' ? 'Error searching location.' : 'লোকেশন অনুসন্ধানে সমস্যা হয়েছে।');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Select a recent search item
  const handleSelectRecent = (item: RecentSearchItem) => {
    setActiveCenter({ lat: item.lat, lng: item.lng });
    setLocationName(item.name);
    setLocationSearchInput(item.name);
    setShowLocationDropdown(false);
    setUserLocation(null);
    setLocationError(null);
    setHasSearched(true);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 14, { duration: 1.2 });
    }

    fetchRealShops(item.lat, item.lng, item.name);
  };

  // High-accuracy GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(language === 'en' ? 'Geolocation not supported by browser' : 'ব্রাউজারে লোকেশন সুবিধা সমর্থিত নয়');
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setActiveCenter({ lat: latitude, lng: longitude });
        setHasSearched(true);

        let disp = 'My GPS Location';
        try {
          const revRes = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData && Array.isArray(revData.features) && revData.features.length > 0) {
              const p = revData.features[0].properties || {};
              disp = [p.name, p.street, p.locality, p.district, p.city, p.country].filter(Boolean).join(', ') || disp;
            }
          }
        } catch (_) {
          try {
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              disp = nomData.display_name?.split(',').slice(0, 3).join(', ') || disp;
            }
          } catch (_) {}
        }

        setLocationName(disp);
        setLocationSearchInput(disp);
        saveRecentSearch(disp, latitude, longitude);
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }

        fetchRealShops(latitude, longitude, disp);
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          language === 'en' 
            ? 'GPS location permission denied. You can search any location above.' 
            : 'জিপিএস অনুমতি পাওয়া যায়নি। আপনি উপরে যেকোনো স্থান লিখে অনুসন্ধান করতে পারেন।'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Compute shop specific rates for current selected pair
  const getShopRate = useCallback((shop: CurrencyShop) => {
    return baseRate * (1 + (shop.rateSpreadModifier || 0.003));
  }, [baseRate]);

  // Filtered and sorted shops list
  const filteredShops = useMemo(() => {
    return shops
      .filter((shop) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = shop.name.toLowerCase().includes(q) || shop.nameBn.includes(q);
          const matchAddr = shop.address.toLowerCase().includes(q) || shop.addressBn.includes(q);
          if (!matchName && !matchAddr) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          const distA = calculateHaversineDistance(activeCenter.lat, activeCenter.lng, a.lat, a.lng);
          const distB = calculateHaversineDistance(activeCenter.lat, activeCenter.lng, b.lat, b.lng);
          return distA - distB;
        }
        if (sortBy === 'rate') {
          return getShopRate(b) - getShopRate(a);
        }
        return 0;
      });
  }, [shops, searchQuery, sortBy, activeCenter, getShopRate]);

  // Set default selected shop
  useEffect(() => {
    if (!selectedShopId && filteredShops.length > 0) {
      setSelectedShopId(filteredShops[0].id);
    }
  }, [filteredShops, selectedShopId]);

  const selectedShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || filteredShops[0] || null;
  }, [shops, selectedShopId, filteredShops]);

  // Calculate live payout amount
  const selectedShopRate = selectedShop ? getShopRate(selectedShop) : baseRate;
  const calculatedPayout = exchangeAmount > 0 ? exchangeAmount * selectedShopRate : 0;

  const toCurrencyObj = POPULAR_CURRENCIES.find(c => c.code === toCurrency) || { code: toCurrency, name: toCurrency, nameBn: toCurrency, symbol: toCurrency, flag: '🌐' };
  const fromCurrencyObj = POPULAR_CURRENCIES.find(c => c.code === fromCurrency) || { code: fromCurrency, name: fromCurrency, nameBn: fromCurrency, symbol: fromCurrency, flag: '🌐' };

  // Swap currencies
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeCenter.lat, activeCenter.lng],
        zoom: hasSearched ? 14 : 7,
        zoomControl: false,
        attributionControl: false
      });

      // Pure OpenStreetMap + Leaflet
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      L.control.zoom({ position: 'topright' }).addTo(map);

      // On map click: search location at clicked coordinates
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setActiveCenter({ lat, lng });
        setUserLocation(null);
        setHasSearched(true);
        let disp = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const revRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData && Array.isArray(revData.features) && revData.features.length > 0) {
              const p = revData.features[0].properties || {};
              disp = [p.name, p.street, p.locality, p.district, p.city, p.country].filter(Boolean).join(', ') || disp;
            }
          }
        } catch (_) {
          try {
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              disp = nomData.display_name?.split(',').slice(0, 3).join(', ') || disp;
            }
          } catch (_) {}
        }
        setLocationName(disp);
        setLocationSearchInput(disp);
        saveRecentSearch(disp, lat, lng);
        fetchRealShops(lat, lng, disp);
      });

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Add Center Location Marker if user searched or clicked
    if (hasSearched || userLocation) {
      const centerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 rounded-full bg-sky-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </div>
        </div>
      `;

      const centerIcon = L.divIcon({
        className: 'user-pin-marker',
        html: centerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const centerMarker = L.marker([activeCenter.lat, activeCenter.lng], { icon: centerIcon });
      centerMarker.bindTooltip(
        `<div class="font-bold text-xs px-1 text-slate-800">${language === 'en' ? 'Searched Location' : 'অনুসন্ধানকৃত এলাকা'}</div>`,
        { permanent: false, direction: 'top' }
      );
      markersGroup.addLayer(centerMarker);
    }

    // 2. Add Real Shop Markers
    filteredShops.forEach((shop) => {
      const isSelected = selectedShop?.id === shop.id;
      const rateVal = getShopRate(shop);
      const formattedRate = rateVal.toFixed(2);

      const shopHtml = `
        <div class="group relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-10'}">
          <div class="px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border whitespace-nowrap flex items-center gap-1 ${
            isSelected 
              ? 'bg-accent text-white border-accent ring-2 ring-accent/40' 
              : 'bg-slate-900/90 text-white border-slate-700'
          }">
            1 ${fromCurrency} = ${formattedRate} ${toCurrency}
          </div>
          <div class="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 ${
            isSelected 
              ? 'bg-accent text-white border-white scale-110' 
              : 'bg-emerald-600 text-white border-white'
          }">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
      `;

      const shopIcon = L.divIcon({
        className: 'shop-pin-marker',
        html: shopHtml,
        iconSize: [40, 48],
        iconAnchor: [20, 48]
      });

      const marker = L.marker([shop.lat, shop.lng], { icon: shopIcon });
      marker.on('click', () => {
        setSelectedShopId(shop.id);
      });

      marker.bindTooltip(
        `<div class="font-bold text-xs px-1 text-slate-800">${shop.name}</div>`,
        { direction: 'top', offset: [0, -45] }
      );

      markersGroup.addLayer(marker);
    });
  }, [activeCenter, filteredShops, selectedShop, fromCurrency, toCurrency, language, getShopRate, hasSearched, userLocation, fetchRealShops]);

  // Invalidate map size on view mode toggle
  useEffect(() => {
    if (viewMode === 'map' || viewMode === 'split') {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [viewMode]);

  // Copy quote handler
  const handleCopyQuote = () => {
    const text = `Currency Exchange Calculation:
${exchangeAmount} ${fromCurrency} = ${calculatedPayout.toFixed(2)} ${toCurrency}
Rate: 1 ${fromCurrency} = ${selectedShopRate.toFixed(4)} ${toCurrency}
Counter: ${selectedShop ? selectedShop.name : 'OpenStreetMap Currency Exchange'}
Location: ${selectedShop ? selectedShop.address : locationName}`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  // Add directly to transactions
  const handleRecordTransaction = () => {
    if (!onAddTransaction) return;
    const today = new Date().toISOString().split('T')[0];
    onAddTransaction({
      amount: calculatedPayout,
      category: 'catOther',
      date: today,
      description: `Currency Exchange: Exchanged ${exchangeAmount} ${fromCurrency} to ${calculatedPayout.toFixed(2)} ${toCurrency} at ${selectedShop ? selectedShop.name : locationName}`,
      type: 'income'
    });
    setRecordedSuccess(true);
    setTimeout(() => setRecordedSuccess(false), 3000);
  };

  return (
    <div className={cn("w-full max-w-full overflow-x-hidden p-2 sm:p-4 space-y-3 sm:space-y-4 relative", className)}>
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-income/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-2 sm:gap-3 border-b border-glass-border/40 pb-2.5 sm:pb-3">
        {/* Left: View Mode Segmented Control */}
        <div className="flex items-center justify-between xs:justify-start gap-2 w-full xs:w-auto">
          <div className="inline-flex items-center bg-glass p-1 rounded-xl border border-glass-border shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === 'list' ? "bg-accent text-white shadow-sm" : "text-muted hover:text-primary"
              )}
              title={language === 'en' ? 'List View' : 'তালিকা ভিউ'}
            >
              <List size={13} />
              <span>{language === 'en' ? 'List' : 'তালিকা'}</span>
              {hasSearched && filteredShops.length > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                  viewMode === 'list' ? "bg-white/20 text-white" : "bg-accent/15 text-accent"
                )}>
                  {filteredShops.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('map');
                setTimeout(() => {
                  mapInstanceRef.current?.invalidateSize();
                }, 150);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === 'map' ? "bg-accent text-white shadow-sm" : "text-muted hover:text-primary"
              )}
              title={language === 'en' ? 'Map View' : 'ম্যাপ ভিউ'}
            >
              <MapIcon size={13} />
              <span>{language === 'en' ? 'Map' : 'ম্যাপ'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('split');
                setTimeout(() => {
                  mapInstanceRef.current?.invalidateSize();
                }, 150);
              }}
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === 'split' ? "bg-accent text-white shadow-sm" : "text-muted hover:text-primary"
              )}
              title={language === 'en' ? 'Split View (List + Map)' : 'স্প্লিট ভিউ'}
            >
              <Layers size={13} />
              <span>{language === 'en' ? 'Split' : 'স্প্লিট'}</span>
            </button>
          </div>
        </div>

        {/* Right side: Active location indicator */}
        {locationName && (
          <div className="flex items-center gap-1 text-[11px] text-muted truncate max-w-[200px] sm:max-w-[280px]">
            <MapPin size={12} className="text-accent shrink-0" />
            <span className="truncate">{locationName}</span>
          </div>
        )}
      </div>

      {/* DEDICATED LOCATION SEARCH BAR */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-0">
            <form onSubmit={handleSubmitLocationSearch} className="relative flex items-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none flex items-center">
                {isSearchingLocation ? (
                  <Loader2 size={15} className="animate-spin text-accent" />
                ) : (
                  <MapPin size={15} className="text-accent" />
                )}
              </div>

              <input
                type="text"
                value={locationSearchInput}
                onChange={(e) => {
                  setLocationSearchInput(e.target.value);
                  setShowLocationDropdown(true);
                }}
                onFocus={() => {
                  setShowLocationDropdown(true);
                }}
                placeholder={language === 'en' ? 'Search area, road or city...' : 'এলাকা, সড়ক বা শহরের নাম লিখুন...'}
                className="w-full pl-9 pr-16 sm:pr-20 py-2 sm:py-2.5 rounded-xl bg-glass border border-glass-border text-xs sm:text-sm text-primary placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-medium"
              />

              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {locationSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationSearchInput('');
                      setLocationSuggestions([]);
                    }}
                    className="p-1 rounded-lg text-muted hover:text-primary transition-colors cursor-pointer"
                    title={language === 'en' ? 'Clear' : 'মুছুন'}
                  >
                    <X size={13} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSearchingLocation}
                  className="px-2.5 py-1 rounded-lg bg-accent text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Search size={12} />
                  <span className="hidden xs:inline">{language === 'en' ? 'Search' : 'খুঁজুন'}</span>
                </button>
              </div>
            </form>

            {/* Nominatim Suggestions Dropdown or Recent Searches when input is empty */}
            {showLocationDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-bg-deep/95 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-glass-border/40 max-h-60 overflow-y-auto">
                {locationSuggestions.length > 0 ? (
                  locationSuggestions.map((place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => handleSelectLocation(place)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-accent/15 transition-colors flex items-start gap-2.5 group cursor-pointer"
                    >
                      <MapPinned size={14} className="text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-primary truncate group-hover:text-accent transition-colors">
                          {place.name || place.display_name.split(',')[0]}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted truncate mt-0.5">
                          {place.display_name}
                        </div>
                      </div>
                    </button>
                  ))
                ) : !locationSearchInput.trim() && recentSearches.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between px-3.5 py-2 bg-glass/60 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-glass-border/40">
                      <span className="flex items-center gap-1">
                        <History size={11} className="text-accent" />
                        {language === 'en' ? 'Recent Searches' : 'সাম্প্রতিক অনুসন্ধান'}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllRecentSearches}
                        className="text-muted hover:text-rose-400 flex items-center gap-1 cursor-pointer normal-case text-[10px] font-semibold transition-colors"
                      >
                        <Trash2 size={10} />
                        <span>{language === 'en' ? 'Clear All' : 'সব মুছুন'}</span>
                      </button>
                    </div>
                    {recentSearches.map((item, idx) => (
                      <div
                        key={`dropdown-recent-${item.lat}-${item.lng}-${idx}`}
                        className="w-full px-3.5 py-2 text-left hover:bg-accent/15 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                        onClick={() => handleSelectRecent(item)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <History size={13} className="text-accent shrink-0" />
                          <span className="text-xs font-medium text-primary group-hover:text-accent transition-colors truncate">
                            {item.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRecentSearch(e, idx)}
                          className="p-1 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={language === 'en' ? 'Delete search' : 'মুছুন'}
                          aria-label={`Delete ${item.name}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* GPS Auto-detect Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            title={language === 'en' ? 'Detect GPS location' : 'আমার অবস্থান নির্ণয় করুন'}
            className={cn(
              "px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap cursor-pointer",
              userLocation 
                ? "bg-accent/15 text-accent border-accent/40 hover:bg-accent/25" 
                : "bg-glass hover:bg-glass/80 text-muted border-glass-border hover:text-primary"
            )}
          >
            <Compass size={14} className={cn(isLocating && "animate-spin text-accent")} />
            <span className="hidden xs:inline">
              {isLocating 
                ? (language === 'en' ? 'Locating...' : 'চিহ্নিত হচ্ছে...') 
                : userLocation 
                  ? (language === 'en' ? 'GPS Active' : 'জিপিএস সক্রিয়') 
                  : (language === 'en' ? 'My Location' : 'আমার অবস্থান')}
            </span>
          </button>
        </div>

        {/* Recent Searches Horizontal Bar (Clean, unboxed, scrollable) */}
        {recentSearches.length > 0 ? (
          <div className="flex items-center gap-1.5 py-0.5 text-xs w-full overflow-x-auto no-scrollbar">
            <span className="text-muted font-bold shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <History size={11} className="text-accent" />
              {language === 'en' ? 'Recent:' : 'সাম্প্রতিক:'}
            </span>
            {recentSearches.map((item, index) => (
              <div
                key={`${item.lat}-${item.lng}-${index}`}
                className="inline-flex items-center rounded-lg border text-[11px] font-medium bg-glass/60 border-glass-border hover:border-accent/40 transition-all overflow-hidden group shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleSelectRecent(item)}
                  className="px-2 py-0.5 text-muted hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-[160px] cursor-pointer"
                  title={item.name}
                >
                  📍 {item.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteRecentSearch(e, index)}
                  className="px-1.5 py-0.5 text-muted hover:text-rose-400 hover:bg-rose-500/10 border-l border-glass-border/60 transition-colors cursor-pointer"
                  title={language === 'en' ? `Delete "${item.name}"` : `"${item.name}" মুছুন`}
                  aria-label={`Delete ${item.name}`}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleClearAllRecentSearches}
              className="px-2 py-0.5 rounded-lg border text-[10px] font-bold text-muted hover:text-rose-400 hover:border-rose-400/40 bg-glass/40 hover:bg-rose-500/10 transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-1"
              title={language === 'en' ? 'Clear all recent searches' : 'সব সাম্প্রতিক অনুসন্ধান মুছুন'}
            >
              <Trash2 size={10} />
              <span>{language === 'en' ? 'Clear' : 'মুছুন'}</span>
            </button>
          </div>
        ) : (
          <div className="text-muted text-[11px] flex items-center gap-1 py-0.5 truncate">
            <MapPin size={11} className="text-accent shrink-0" />
            <span className="truncate">
              {language === 'en'
                ? 'Type any location or use GPS to view live OpenStreetMap exchange counters.'
                : 'ওপেনস্ট্রিটম্যাপ কাউন্টার দেখতে যেকোনো এলাকা লিখুন বা জিপিএস চাপুন।'}
            </span>
          </div>
        )}
      </div>

      {/* Status / Error notification bar */}
      {locationError && (
        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Info size={14} className="text-amber-400 shrink-0" />
            <span className="truncate">{locationError}</span>
          </div>
          <button 
            onClick={() => setLocationError(null)}
            className="text-amber-400/80 hover:text-amber-300 font-bold p-1 shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SLEEK, COMPACT CURRENCY & RATE CALCULATOR */}
      <div className="rounded-2xl border border-glass-border/70 bg-glass/60 backdrop-blur-md p-3 sm:p-4 space-y-2.5 shadow-sm">
        {/* Calculator Header: Title + Live Rate with Refresh */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <Coins size={14} className="text-accent" />
            <span>{language === 'en' ? 'Exchange Calculator' : 'মুদ্রা রূপান্তরক'}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} className="text-income shrink-0" />
              <span>1 {fromCurrency} = <strong className="text-primary">{baseRate.toFixed(4)}</strong> {toCurrency}</span>
            </span>
            <button
              type="button"
              onClick={fetchLiveRates}
              disabled={isLoadingRates}
              className="p-1 rounded-lg text-muted hover:text-accent hover:bg-glass transition-colors cursor-pointer"
              title={language === 'en' ? `Refresh Live Rate (${ratesLastUpdated})` : 'লাইভ রেট রিফ্রেশ'}
            >
              <RefreshCw size={11} className={cn(isLoadingRates && "animate-spin text-accent")} />
            </button>
          </div>
        </div>

        {/* Two-box exchange row: sleek and compact on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2 sm:gap-2.5">
          {/* Box 1: You Exchange (From) */}
          <div className="bg-bg-deep/70 rounded-xl p-2.5 sm:p-3 border border-glass-border focus-within:border-accent/60 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                {language === 'en' ? 'You Exchange' : 'আপনার মুদ্রা'}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <span>{fromCurrencyObj.flag}</span>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="bg-transparent text-primary font-bold text-xs focus:outline-none cursor-pointer appearance-none pr-1"
                >
                  {POPULAR_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-bg-deep text-primary">
                      {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="text-muted pointer-events-none -ml-1" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-muted shrink-0">{fromCurrencyObj.symbol}</span>
              <input
                type="number"
                min="1"
                step="any"
                value={exchangeAmount || ''}
                onChange={(e) => setExchangeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-right bg-transparent text-lg sm:text-xl font-black text-primary focus:outline-none placeholder:text-muted/40 selection:bg-accent/30 tracking-tight tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="100"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1 sm:my-0">
            <button
              type="button"
              onClick={handleSwapCurrencies}
              title={language === 'en' ? 'Swap currencies' : 'মুদ্রা বদল করুন'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/15 border border-accent/30 text-accent hover:bg-accent hover:text-white flex items-center justify-center transition-all shadow-sm shrink-0 active:scale-90 cursor-pointer"
            >
              <ArrowRightLeft size={13} />
            </button>
          </div>

          {/* Box 2: You Receive (To) */}
          <div className="bg-bg-deep/70 rounded-xl p-2.5 sm:p-3 border border-glass-border">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] uppercase font-bold text-income tracking-wider truncate">
                {selectedShop 
                  ? (language === 'en' ? `At ${selectedShop.name}` : `${selectedShop.nameBn}-এ`) 
                  : (language === 'en' ? 'You Receive' : 'আপনি পাবেন')}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <span>{toCurrencyObj.flag}</span>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-transparent text-primary font-bold text-xs focus:outline-none cursor-pointer appearance-none pr-1"
                >
                  {POPULAR_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-bg-deep text-primary">
                      {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="text-muted pointer-events-none -ml-1" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted shrink-0">
                ≈ {selectedShopRate.toFixed(2)}
              </span>
              <div className="text-lg sm:text-xl font-black text-income truncate tabular-nums text-right">
                {calculatedPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrencyObj.symbol}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Amount Presets Strip - single horizontal line */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-glass-border/30 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted font-bold mr-1 shrink-0 uppercase tracking-wider">
              {language === 'en' ? 'Quick:' : 'দ্রুত:'}
            </span>
            {[50, 100, 300, 500, 1000, 2000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setExchangeAmount(amt)}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all border cursor-pointer shrink-0",
                  exchangeAmount === amt 
                    ? "bg-accent text-white border-accent shadow-sm" 
                    : "bg-glass hover:bg-glass/80 text-muted border-glass-border hover:text-primary"
                )}
              >
                {amt}
              </button>
            ))}
          </div>

          {selectedShop && (
            <div className="text-[10px] text-muted truncate hidden sm:block shrink-0">
              {language === 'en' ? 'Counter Rate:' : 'কাউন্টার রেট:'}{' '}
              <strong className="text-income font-bold">{selectedShopRate.toFixed(4)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* FILTER & SORT BAR (for loaded shops in List / Split view) */}
      {hasSearched && shops.length > 0 && (viewMode === 'list' || viewMode === 'split') && (
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Filter shops by name or road...' : 'দোকানের নাম বা রাস্তা দিয়ে খুঁজুন...'}
              className="w-full pl-8 pr-6 py-1.5 rounded-xl bg-glass border border-glass-border text-xs text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-glass border border-glass-border text-primary focus:outline-none focus:border-accent cursor-pointer appearance-none pr-6"
            >
              <option value="distance" className="bg-bg-deep text-primary">{language === 'en' ? 'Nearest' : 'নিকটতম'}</option>
              <option value="rate" className="bg-bg-deep text-primary">{language === 'en' ? 'Best Rate' : 'সেরা রেট'}</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE: LIST & INTERACTIVE MAP */}
      <div className={cn(
        "grid gap-3 sm:gap-5 transition-all duration-300 w-full min-w-0",
        viewMode === 'split' ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
      )}>
        {/* SHOP CARDS LIST COLUMN */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={cn(
            "space-y-2.5 sm:space-y-3 min-w-0 w-full",
            viewMode === 'split' ? "lg:col-span-6 xl:col-span-5 max-h-[620px] overflow-y-auto pr-0 sm:pr-1" : ""
          )}>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted font-bold px-1">
              <span className="flex items-center gap-1.5">
                {isLoadingShops && <Loader2 size={12} className="animate-spin text-accent" />}
                <span>
                  {hasSearched ? (
                    `${filteredShops.length} ${language === 'en' ? 'Counters on OpenStreetMap' : 'টি এক্সচেঞ্জ কাউন্টার'}`
                  ) : (
                    language === 'en' ? 'Search a Location to Discover Shops' : 'কাউন্টার দেখতে অনুসন্ধান করুন'
                  )}
                </span>
              </span>
              {hasSearched && filteredShops.length > 0 && (
                <span className="text-[10px] sm:text-xs text-accent">{language === 'en' ? 'Tap card to calculate' : 'হিসাব করতে চাপুন'}</span>
              )}
            </div>

            {/* If user has not searched yet: Show search prompt */}
            {!hasSearched ? (
              <div className="p-6 sm:p-8 text-center rounded-2xl border border-dashed border-glass-border bg-glass/30 space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent shadow-inner">
                  <Search size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-primary">
                    {language === 'en' ? 'Search Any Location to View Nearby Shops' : 'আশেপাশের কাউন্টার দেখতে এলাকা অনুসন্ধান করুন'}
                  </h4>
                  <p className="text-xs text-muted max-w-xs sm:max-w-sm mx-auto">
                    {language === 'en'
                      ? 'Type an area, road, or city in the search box above to discover real OpenStreetMap currency exchange counters nearby.'
                      : 'ওপেনস্ট্রিটম্যাপে রিয়েল মানি চেঞ্জার দেখতে উপরের সার্চ বক্সে আপনার এলাকা বা শহরের নাম লিখুন।'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/15 text-accent border border-accent/30 hover:bg-accent hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Compass size={13} className={cn(isLocating && "animate-spin")} />
                  <span>{language === 'en' ? 'Use My Location' : 'আমার অবস্থান ব্যবহার করুন'}</span>
                </button>
              </div>
            ) : isLoadingShops ? (
              <div className="p-6 text-center rounded-2xl border border-glass-border bg-glass/40 space-y-2">
                <Loader2 size={20} className="mx-auto text-accent animate-spin" />
                <p className="text-xs font-bold text-primary">
                  {language === 'en' ? `Searching OpenStreetMap near ${locationName || 'location'}...` : 'ওপেনস্ট্রিটম্যাপে কাউন্টার খোঁজা হচ্ছে...'}
                </p>
              </div>
            ) : filteredShops.length === 0 ? (
              /* No shops found */
              <div className="p-6 text-center rounded-2xl border border-dashed border-glass-border bg-glass/40 space-y-2">
                <Building2 className="mx-auto text-muted opacity-50" size={32} />
                <div>
                  <p className="text-primary font-bold text-xs sm:text-sm">
                    {language === 'en' ? 'No registered currency exchangers found at this location' : 'এই স্থানে কোনো নিবন্ধিত মুদ্রা বিনিময় কেন্দ্র পাওয়া যায়নি'}
                  </p>
                  <p className="text-[11px] text-muted mt-1 max-w-sm mx-auto">
                    {language === 'en' 
                      ? `OpenStreetMap has no bureau de change counters registered directly at "${locationName}". Try searching an adjacent commercial center.` 
                      : `"${locationName}"-এর কাছাকাছি কোনো নিবন্ধিত কাউন্টার নেই। নিকটবর্তী বাণিজ্যিক এলাকা বা প্রধান সড়ক লিখে খুঁজুন।`}
                  </p>
                </div>
              </div>
            ) : (
              /* Real OpenStreetMap Shops List */
              <div className="space-y-2.5">
                {filteredShops.map((shop) => {
                  const isSelected = selectedShop?.id === shop.id;
                  const dist = calculateHaversineDistance(activeCenter.lat, activeCenter.lng, shop.lat, shop.lng);
                  const rate = getShopRate(shop);
                  const shopPayout = exchangeAmount * rate;

                  return (
                    <div
                      key={shop.id}
                      onClick={() => setSelectedShopId(shop.id)}
                      className={cn(
                        "p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative group min-w-0 shadow-sm",
                        isSelected 
                          ? "bg-glass border-accent shadow-md shadow-accent/10 ring-1 ring-accent" 
                          : "bg-glass/40 border-glass-border hover:bg-glass/70 hover:border-glass-border/80"
                      )}
                    >
                      {/* Top Row: Shop Name & Distance */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-primary text-sm sm:text-base group-hover:text-accent transition-colors truncate">
                            {language === 'en' ? shop.name : shop.nameBn}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-muted mt-0.5 truncate flex items-center gap-1">
                            <MapPin size={11} className="text-muted shrink-0" />
                            <span className="truncate">{language === 'en' ? shop.address : shop.addressBn}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-accent px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20">
                            <Navigation size={10} className="rotate-45" />
                            {formatDistance(dist, language)}
                          </span>
                        </div>
                      </div>

                      {/* Financial Highlight Banner */}
                      <div className="mt-2 p-2 sm:p-2.5 rounded-xl bg-bg-deep/70 border border-glass-border/60 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] sm:text-[10px] text-muted font-bold uppercase tracking-wider block">
                            {language === 'en' ? 'Counter Rate' : 'কাউন্টার রেট'}
                          </span>
                          <div className="text-xs sm:text-sm font-black text-primary truncate tabular-nums">
                            1 {fromCurrency} = <span className="text-income">{rate.toFixed(4)}</span> {toCurrency}
                          </div>
                        </div>

                        <div className="text-right min-w-0">
                          <span className="text-[9px] sm:text-[10px] text-muted font-bold uppercase tracking-wider block">
                            {language === 'en' ? 'You Receive' : 'আপনি পাবেন'}
                          </span>
                          <div className="text-xs sm:text-sm font-black text-income truncate tabular-nums">
                            {shopPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrencyObj.symbol}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Directions, Map, Phone */}
                      <div className="mt-2 pt-1.5 border-t border-glass-border/30 flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="text-[10px] text-muted truncate">
                          {shop.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone size={10} className="text-muted shrink-0" />
                              <span className="truncate">{shop.phone}</span>
                            </span>
                          ) : (
                            <span className="text-muted/60">{shop.osmType ? `OSM: ${shop.osmType.replace(/_/g, ' ')}` : 'Verified on OSM'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                          <a
                            href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${activeCenter.lat}%2C${activeCenter.lng}%3B${shop.lat}%2C${shop.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-accent text-white text-[11px] font-bold hover:brightness-110 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                            title={language === 'en' ? 'Get Directions' : 'দিকনির্দেশনা'}
                          >
                            <Navigation size={11} />
                            <span>{language === 'en' ? 'Directions' : 'দিকনির্দেশনা'}</span>
                          </a>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShopId(shop.id);
                              setViewMode('map');
                              setTimeout(() => {
                                mapInstanceRef.current?.invalidateSize();
                                mapInstanceRef.current?.panTo([shop.lat, shop.lng], { animate: true });
                              }, 150);
                            }}
                            className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-accent/15 hover:bg-accent text-accent hover:text-white border border-accent/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title={language === 'en' ? 'View on Map' : 'ম্যাপে দেখুন'}
                          >
                            <MapIcon size={11} />
                            <span>{language === 'en' ? 'Map' : 'ম্যাপ'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* In 'list' mode, show selected shop detailed slip below list */}
            {viewMode === 'list' && selectedShop && (
              <div className="mt-3 pt-1">
                <SelectedShopSlip
                  selectedShop={selectedShop}
                  activeCenter={activeCenter}
                  selectedShopRate={selectedShopRate}
                  calculatedPayout={calculatedPayout}
                  exchangeAmount={exchangeAmount}
                  fromCurrency={fromCurrency}
                  toCurrency={toCurrency}
                  fromCurrencyObj={fromCurrencyObj}
                  toCurrencyObj={toCurrencyObj}
                  language={language}
                  copiedQuote={copiedQuote}
                  handleCopyQuote={handleCopyQuote}
                  onAddTransaction={onAddTransaction}
                  recordedSuccess={recordedSuccess}
                  handleRecordTransaction={handleRecordTransaction}
                  onViewOnMap={() => {
                    setViewMode('map');
                    setTimeout(() => {
                      mapInstanceRef.current?.invalidateSize();
                      mapInstanceRef.current?.panTo([selectedShop.lat, selectedShop.lng], { animate: true });
                    }, 150);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* MAP & CALCULATOR COLUMN */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={cn(
            "space-y-3 sm:space-y-4 min-w-0 w-full relative",
            viewMode === 'split' ? "lg:col-span-6 xl:col-span-7" : "col-span-1"
          )}>
            {/* INTERACTIVE OPENSTREETMAP CONTAINER */}
            <div className={cn(
              "relative rounded-2xl overflow-hidden border border-glass-border shadow-lg bg-bg-deep transition-all duration-300 w-full",
              isFullscreenActive 
                ? (viewMode === 'map' ? "h-[75vh] sm:h-[82vh]" : "h-[480px] lg:h-[72vh]")
                : (viewMode === 'map' ? "h-[55vh] sm:h-[420px] lg:h-[460px]" : "h-[320px] sm:h-[380px] lg:h-[420px]")
            )}>
              {/* Map Floating Top Controls */}
              <div className="absolute top-2 left-2 right-12 z-[400] flex items-center justify-between gap-1.5 pointer-events-none">
                {/* Left: Active Location & Recenter */}
                <div className="pointer-events-auto flex items-center gap-1 min-w-0">
                  <div className="px-2 sm:px-3 py-1 rounded-xl bg-bg-deep/90 backdrop-blur-md border border-glass-border text-primary text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-lg max-w-[130px] xs:max-w-[180px] sm:max-w-none truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-income animate-pulse shrink-0" />
                    <span className="truncate">{locationName || (language === 'en' ? 'Click map to search spot' : 'ম্যাপে চাপ দিয়ে খুঁজুন')}</span>
                  </div>
                  {hasSearched && (
                    <button
                      onClick={() => {
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([activeCenter.lat, activeCenter.lng], 14, { animate: true });
                        }
                      }}
                      title={language === 'en' ? 'Center on Location' : 'অবস্থানে কেন্দ্র করুন'}
                      className="p-1 sm:p-1.5 rounded-xl bg-bg-deep/90 backdrop-blur-md border border-glass-border text-primary hover:text-accent shadow-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <Navigation size={13} />
                    </button>
                  )}
                </div>

                {/* Right: OpenStreetMap badge & Fullscreen toggle */}
                <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-bg-deep/90 backdrop-blur-md px-2 py-1 rounded-xl border border-glass-border text-[10px] shadow-lg shrink-0">
                  <div className="flex items-center gap-1 text-primary font-bold text-[10px]">
                    <Globe size={11} className="text-income shrink-0" />
                    <span>OSM</span>
                    <span className="px-1 py-0.2 rounded bg-income/20 text-income text-[8px] font-bold border border-income/30">Live</span>
                  </div>
                  <div className="h-2.5 w-px bg-glass-border" />
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="text-[10px] text-muted hover:text-accent transition-colors flex items-center gap-1 font-bold cursor-pointer"
                    title={isFullscreenActive ? (language === 'en' ? 'Exit Full Screen' : 'ফুল স্ক্রিন প্রস্থান') : (language === 'en' ? 'Full Screen Map' : 'ফুল স্ক্রিন ম্যাপ')}
                  >
                    {isFullscreenActive ? <Minimize2 size={11} className="text-accent" /> : <Maximize2 size={11} />}
                    <span className="hidden xs:inline">{isFullscreenActive ? (language === 'en' ? 'Exit' : 'প্রস্থান') : (language === 'en' ? 'Full' : 'ফুল')}</span>
                  </button>
                </div>
              </div>

              {/* Pure Leaflet Vector Map Container */}
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Map pin legend banner */}
              <div className="absolute bottom-2 left-2 right-2 z-[400] px-2 sm:px-3 py-1 rounded-xl bg-bg-deep/90 backdrop-blur-md border border-glass-border text-[10px] text-muted flex items-center justify-between gap-1 shadow-lg">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block shrink-0" />
                    <span className="text-primary font-medium">{language === 'en' ? 'Searched Pin' : 'অনুসন্ধান পিন'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block shrink-0" />
                    <span className="text-emerald-400 font-medium">{language === 'en' ? 'OSM Shop' : 'কাউন্টার'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent inline-block shrink-0" />
                    <span className="text-accent font-medium">{language === 'en' ? 'Selected' : 'নির্বাচিত'}</span>
                  </span>
                </div>
                <span className="text-[9px] hidden md:inline text-muted shrink-0">
                  {language === 'en' ? 'Tap map to search any spot' : 'যেকোনো স্থানে চাপ দিয়ে খুঁজুন'}
                </span>
              </div>
            </div>

            {/* Mobile Map View: Floating Selected Shop Sheet */}
            {selectedShop && viewMode === 'map' && (
              <div className="sm:hidden p-3 rounded-2xl bg-bg-deep/95 backdrop-blur-xl border border-glass-border shadow-xl space-y-2 mt-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-sm text-primary truncate">
                      {language === 'en' ? selectedShop.name : selectedShop.nameBn}
                    </h5>
                    <p className="text-[11px] text-muted truncate">
                      {language === 'en' ? selectedShop.address : selectedShop.addressBn}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-accent shrink-0">
                    {formatDistance(calculateHaversineDistance(activeCenter.lat, activeCenter.lng, selectedShop.lat, selectedShop.lng), language)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-glass-border/40">
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">{language === 'en' ? 'Rate' : 'রেট'}</span>
                    <span className="font-bold text-primary">1 {fromCurrency} = {selectedShopRate.toFixed(4)} {toCurrency}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted uppercase font-bold block">{language === 'en' ? 'You Receive' : 'প্রাপ্তি'}</span>
                    <span className="font-black text-income">{calculatedPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrencyObj.symbol}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <a
                    href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${activeCenter.lat}%2C${activeCenter.lng}%3B${selectedShop.lat}%2C${selectedShop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 rounded-xl bg-accent text-white text-xs font-bold text-center flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Navigation size={12} />
                    <span>{language === 'en' ? 'Directions' : 'দিকনির্দেশনা'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="py-1.5 rounded-xl bg-glass border border-glass-border text-primary text-xs font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <List size={12} />
                    <span>{language === 'en' ? 'View in List' : 'তালিকায় দেখুন'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop / Split View: SELECTED SHOP DETAILED CALCULATOR SLIP */}
            {selectedShop && (viewMode === 'split' || (viewMode === 'map' && !isFullscreenActive)) && (
              <div className="hidden sm:block">
                <SelectedShopSlip
                  selectedShop={selectedShop}
                  activeCenter={activeCenter}
                  selectedShopRate={selectedShopRate}
                  calculatedPayout={calculatedPayout}
                  exchangeAmount={exchangeAmount}
                  fromCurrency={fromCurrency}
                  toCurrency={toCurrency}
                  fromCurrencyObj={fromCurrencyObj}
                  toCurrencyObj={toCurrencyObj}
                  language={language}
                  copiedQuote={copiedQuote}
                  handleCopyQuote={handleCopyQuote}
                  onAddTransaction={onAddTransaction}
                  recordedSuccess={recordedSuccess}
                  handleRecordTransaction={handleRecordTransaction}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE FLOATING QUICK TOGGLE PILL (Google Maps / Airbnb style) */}
      <div className="sm:hidden flex justify-center pt-2">
        {viewMode === 'list' && (
          <button
            type="button"
            onClick={() => {
              setViewMode('map');
              setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
              }, 150);
            }}
            className="px-4 py-2 rounded-full bg-accent text-white shadow-lg shadow-accent/25 border border-white/20 text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <MapIcon size={14} />
            <span>{language === 'en' ? 'View on Map' : 'ম্যাপে দেখুন'}</span>
          </button>
        )}
        {viewMode === 'map' && (
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="px-4 py-2 rounded-full bg-accent text-white shadow-lg shadow-accent/25 border border-white/20 text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <List size={14} />
            <span>{language === 'en' ? `View List (${filteredShops.length})` : `তালিকা দেখুন (${filteredShops.length})`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
