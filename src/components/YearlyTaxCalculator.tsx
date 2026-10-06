import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Info, 
  HelpCircle, 
  ShieldCheck, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  User, 
  FileText,
  DollarSign,
  Download,
  Percent,
  Coins
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LanguageType } from '../translations';

interface YearlyTaxCalculatorProps {
  transactions: {
    id: string;
    amount: number;
    category: string;
    date: string;
    description: string;
    type: 'income' | 'expense';
  }[];
  currency?: string;
  language?: LanguageType;
}

type TaxSystem = 'bd_nbr' | 'us_irs';
type TaxpayerCategory = 'general' | 'female_senior' | 'disabled' | 'freedom_fighter';
type LocationZone = 'dhaka_ctg' | 'other_city' | 'non_city';

export function YearlyTaxCalculator({
  transactions,
  currency = '৳',
  language = 'en'
}: YearlyTaxCalculatorProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [taxSystem, setTaxSystem] = useState<TaxSystem>(currency === '$' ? 'us_irs' : 'bd_nbr');

  // BD NBR Parameters
  const [taxpayerCategory, setTaxpayerCategory] = useState<TaxpayerCategory>('general');
  const [hasDisabledChild, setHasDisabledChild] = useState<boolean>(false);
  const [locationZone, setLocationZone] = useState<LocationZone>('dhaka_ctg');
  
  // Income Inputs
  const [annualGrossSalary, setAnnualGrossSalary] = useState<string>('');
  const [annualBusinessIncome, setAnnualBusinessIncome] = useState<string>('');
  const [otherIncome, setOtherIncome] = useState<string>('');

  // Eligible Investment for Rebate (DPS, Sanchayapatra, Insurance, Stocks)
  const [investmentAmount, setInvestmentAmount] = useState<string>('');

  // USA IRS Parameters
  const [filingStatus, setFilingStatus] = useState<'single' | 'married_joint' | 'head_household'>('single');

  // UI state
  const [showSlabDetails, setShowSlabDetails] = useState<boolean>(true);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);

  // Auto-calculate yearly income from user's recorded transactions
  const recordedYearlyIncome = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.type !== 'income') return false;
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedYear]);

  // Sync with App's recorded transactions
  const syncWithAppIncome = () => {
    if (recordedYearlyIncome > 0) {
      setAnnualGrossSalary(recordedYearlyIncome.toString());
      setAnnualBusinessIncome('0');
      setOtherIncome('0');
      setAutoFilledNotice(
        language === 'en'
          ? `Imported ${currency}${formatNum(recordedYearlyIncome)} from your ${selectedYear} income transactions.`
          : `আপনার ${selectedYear} সালের আয়ের হিসাব থেকে ${currency}${formatNum(recordedYearlyIncome)} আমদানি করা হয়েছে।`
      );
    } else {
      setAutoFilledNotice(
        language === 'en'
          ? `No income entries found for ${selectedYear}. Please enter income manually.`
          : `${selectedYear} সালের কোনো আয়ের হিসাব পাওয়া যায়নি। অনুগ্রহ করে ম্যানুয়ালি লিখুন।`
      );
    }
    setTimeout(() => setAutoFilledNotice(null), 5000);
  };

  const formatNum = (num: number, maximumFractionDigits: number = 0) => {
    try {
      return num.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
        maximumFractionDigits
      });
    } catch {
      return num.toFixed(maximumFractionDigits);
    }
  };

  // BANGLADESH NBR TAX CALCULATION (Income Tax Act 2023 / Finance Act 2024-25)
  const bdTaxCalculation = useMemo(() => {
    const grossSalary = parseFloat(annualGrossSalary) || 0;
    const businessIncome = parseFloat(annualBusinessIncome) || 0;
    const other = parseFloat(otherIncome) || 0;
    const totalGross = grossSalary + businessIncome + other;

    // Employment Exemption (Under Income Tax Act 2023):
    // 1/3 of employment income or ৳4,50,000 (whichever is lower)
    const salaryExemption = grossSalary > 0 
      ? Math.min(grossSalary / 3, 450000) 
      : 0;
    
    const taxableSalary = Math.max(0, grossSalary - salaryExemption);
    const totalTaxableIncome = taxableSalary + businessIncome + other;

    // Exemption Threshold based on Taxpayer Category
    let baseExemption = 350000; // General male
    if (taxpayerCategory === 'female_senior') baseExemption = 400000;
    if (taxpayerCategory === 'disabled') baseExemption = 475000;
    if (taxpayerCategory === 'freedom_fighter') baseExemption = 500000;
    if (hasDisabledChild) baseExemption += 50000;

    // Minimum Tax based on Location
    let minTax = 5000; // Dhaka & Chittagong
    if (locationZone === 'other_city') minTax = 4000;
    if (locationZone === 'non_city') minTax = 3000;

    // Calculate Progressive Slabs
    let remaining = Math.max(0, totalTaxableIncome - baseExemption);
    const slabs: { label: string; rate: number; taxableInSlab: number; tax: number }[] = [];

    // First Slab: 0% up to base exemption
    slabs.push({
      label: language === 'en' ? `First ${currency}${formatNum(baseExemption)} (Tax-Free)` : `প্রথম ${currency}${formatNum(baseExemption)} (করমুক্ত)`,
      rate: 0,
      taxableInSlab: Math.min(totalTaxableIncome, baseExemption),
      tax: 0
    });

    let grossTax = 0;

    // Next ৳100,000 @ 5%
    if (remaining > 0) {
      const slabAmount = Math.min(remaining, 100000);
      const tax = slabAmount * 0.05;
      grossTax += tax;
      slabs.push({
        label: language === 'en' ? `Next ${currency}1,00,000` : `পরবর্তী ${currency}১,০০,০০০`,
        rate: 5,
        taxableInSlab: slabAmount,
        tax
      });
      remaining -= slabAmount;
    }

    // Next ৳400,000 @ 10%
    if (remaining > 0) {
      const slabAmount = Math.min(remaining, 400000);
      const tax = slabAmount * 0.10;
      grossTax += tax;
      slabs.push({
        label: language === 'en' ? `Next ${currency}4,00,000` : `পরবর্তী ${currency}৪,০০,০০০`,
        rate: 10,
        taxableInSlab: slabAmount,
        tax
      });
      remaining -= slabAmount;
    }

    // Next ৳500,000 @ 15%
    if (remaining > 0) {
      const slabAmount = Math.min(remaining, 500000);
      const tax = slabAmount * 0.15;
      grossTax += tax;
      slabs.push({
        label: language === 'en' ? `Next ${currency}5,00,000` : `পরবর্তী ${currency}৫,০০,০০০`,
        rate: 15,
        taxableInSlab: slabAmount,
        tax
      });
      remaining -= slabAmount;
    }

    // Next ৳500,000 @ 20%
    if (remaining > 0) {
      const slabAmount = Math.min(remaining, 500000);
      const tax = slabAmount * 0.20;
      grossTax += tax;
      slabs.push({
        label: language === 'en' ? `Next ${currency}5,00,000` : `পরবর্তী ${currency}৫,০০,০০০`,
        rate: 20,
        taxableInSlab: slabAmount,
        tax
      });
      remaining -= slabAmount;
    }

    // Remaining Balance @ 25%
    if (remaining > 0) {
      const slabAmount = remaining;
      const tax = slabAmount * 0.25;
      grossTax += tax;
      slabs.push({
        label: language === 'en' ? `Remaining Balance` : `অবশিষ্ট আয়`,
        rate: 25,
        taxableInSlab: slabAmount,
        tax
      });
      remaining = 0;
    }

    // Investment Tax Rebate (Section 78):
    // 15% of allowable investment, capped at 20% of taxable income or ৳10,00,000
    const inv = parseFloat(investmentAmount) || 0;
    const maxAllowableInvestment = Math.min(totalTaxableIncome * 0.20, 1000000);
    const eligibleInvestment = Math.min(inv, maxAllowableInvestment);
    const investmentRebate = eligibleInvestment * 0.15;

    // Net tax after rebate (cannot reduce below 0)
    let netTax = Math.max(0, grossTax - investmentRebate);

    // Apply Minimum Tax rule:
    // If taxable income > baseExemption, tax cannot be lower than location minimum tax
    const isTaxable = totalTaxableIncome > baseExemption;
    let finalTaxPayable = 0;
    let isMinTaxApplied = false;

    if (isTaxable) {
      if (netTax < minTax) {
        finalTaxPayable = minTax;
        isMinTaxApplied = true;
      } else {
        finalTaxPayable = netTax;
      }
    } else {
      finalTaxPayable = 0;
    }

    const effectiveTaxRate = totalGross > 0 ? (finalTaxPayable / totalGross) * 100 : 0;
    const monthlyTDS = finalTaxPayable / 12;

    return {
      totalGross,
      salaryExemption,
      totalTaxableIncome,
      baseExemption,
      minTax,
      slabs,
      grossTax,
      investmentRebate,
      eligibleInvestment,
      maxAllowableInvestment,
      finalTaxPayable,
      isMinTaxApplied,
      effectiveTaxRate,
      monthlyTDS,
      isTaxable
    };
  }, [
    annualGrossSalary,
    annualBusinessIncome,
    otherIncome,
    investmentAmount,
    taxpayerCategory,
    hasDisabledChild,
    locationZone,
    language,
    currency
  ]);

  // USA IRS TAX CALCULATION (Federal 2024/2025 Standard Brackets)
  const usTaxCalculation = useMemo(() => {
    const gross = (parseFloat(annualGrossSalary) || 0) + (parseFloat(annualBusinessIncome) || 0) + (parseFloat(otherIncome) || 0);

    let standardDeduction = 14600; // Single
    if (filingStatus === 'married_joint') standardDeduction = 29200;
    if (filingStatus === 'head_household') standardDeduction = 21900;

    const taxableIncome = Math.max(0, gross - standardDeduction);

    // 2024 US Federal Tax Brackets for Single / Married
    const singleBrackets = [
      { cap: 11600, rate: 0.10 },
      { cap: 47150, rate: 0.12 },
      { cap: 100525, rate: 0.22 },
      { cap: 191950, rate: 0.24 },
      { cap: 243725, rate: 0.32 },
      { cap: 609350, rate: 0.35 },
      { cap: Infinity, rate: 0.37 }
    ];

    let tax = 0;
    let prevCap = 0;
    const slabs: { label: string; rate: number; taxableInSlab: number; tax: number }[] = [];

    for (const b of singleBrackets) {
      if (taxableIncome > prevCap) {
        const taxableInBracket = Math.min(taxableIncome, b.cap) - prevCap;
        const bracketTax = taxableInBracket * b.rate;
        tax += bracketTax;
        slabs.push({
          label: `${prevCap === 0 ? '$0' : '$' + prevCap.toLocaleString()} - ${b.cap === Infinity ? 'Above' : '$' + b.cap.toLocaleString()}`,
          rate: b.rate * 100,
          taxableInSlab: taxableInBracket,
          tax: bracketTax
        });
        prevCap = b.cap;
      } else {
        break;
      }
    }

    const effectiveRate = gross > 0 ? (tax / gross) * 100 : 0;
    const monthlyTDS = tax / 12;

    return {
      totalGross: gross,
      standardDeduction,
      totalTaxableIncome: taxableIncome,
      slabs,
      finalTaxPayable: tax,
      effectiveTaxRate: effectiveRate,
      monthlyTDS
    };
  }, [annualGrossSalary, annualBusinessIncome, otherIncome, filingStatus]);

  const activeResult = taxSystem === 'bd_nbr' ? bdTaxCalculation : usTaxCalculation;

  return (
    <div className="space-y-8">
      {/* Header with System Switcher and Sync Button */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-accent/20 via-glass to-transparent border border-accent/30 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-accent/20 text-accent">
                <Calculator size={18} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {language === 'en' ? 'Official Gov Tax Calculator' : 'সরকারী নিয়ম অনুযায়ী আয়কর ক্যালকুলেটর'}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              {language === 'en' ? 'Yearly Income Tax Assessment' : 'বার্ষিক আয়কর হিসাব ও বিবরণী'}
            </h3>
            <p className="text-xs text-muted mt-1.5 max-w-xl">
              {language === 'en'
                ? 'Accurately computes your annual tax liability, salary exemptions, progressive slabs, and investment rebates according to statutory government guidelines.'
                : 'সরকারী অর্থ আইন ও আয়কর আইন অনুযায়ী করমুক্ত আয়সীমা, স্ল্যাবভিত্তিক কর, বিনিয়োগ রেয়াত এবং ন্যূনতম করের সঠিক হিসাব।'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Sync with Incomes in App */}
            <button
              type="button"
              onClick={syncWithAppIncome}
              className="px-4 py-2.5 rounded-2xl bg-accent text-white hover:bg-accent/90 font-bold text-xs tracking-wide shadow-md shadow-accent/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              title={language === 'en' ? 'Import from recorded incomes' : 'আয় থেকে তথ্য আনুন'}
            >
              <Sparkles size={15} />
              {language === 'en' ? `Auto-Fill (${selectedYear} Inflow)` : `${selectedYear}-এর আয় যোগ করুন`}
            </button>

            {/* Tax Rules System Toggle */}
            <div className="flex bg-glass border border-glass-border p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTaxSystem('bd_nbr')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                  taxSystem === 'bd_nbr' 
                    ? "bg-accent text-white shadow-sm" 
                    : "text-muted hover:text-primary"
                )}
              >
                🇧🇩 BD (NBR)
              </button>
              <button
                type="button"
                onClick={() => setTaxSystem('us_irs')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                  taxSystem === 'us_irs' 
                    ? "bg-accent text-white shadow-sm" 
                    : "text-muted hover:text-primary"
                )}
              >
                🇺🇸 US (IRS)
              </button>
            </div>
          </div>
        </div>

        {/* Auto fill feedback */}
        {autoFilledNotice && (
          <div className="mt-4 p-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-semibold flex items-center gap-2 animate-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{autoFilledNotice}</span>
          </div>
        )}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Taxpayer Profile & Rules */}
        <div className="glass-card space-y-4">
          <h4 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-glass-border">
            <User size={16} className="text-accent" />
            {language === 'en' ? 'Taxpayer Profile & Category' : 'করদাতার বিবরণ ও করমুক্ত সীমা'}
          </h4>

          {taxSystem === 'bd_nbr' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {language === 'en' ? 'Taxpayer Classification' : 'করদাতার ধরন'}
                </label>
                <select
                  value={taxpayerCategory}
                  onChange={(e) => setTaxpayerCategory(e.target.value as TaxpayerCategory)}
                  className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-primary focus:outline-none focus:border-accent/60"
                >
                  <option value="general" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'General Individual (৳3,50,000 exempt)' : 'সাধারণ করদাতা (৩,৫০,০০০ টাকা করমুক্ত)'}
                  </option>
                  <option value="female_senior" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Female or Senior 65+ (৳4,00,000 exempt)' : 'নারী অথবা ৬৫+ বয়স্ক (৪,০০,০০০ টাকা করমুক্ত)'}
                  </option>
                  <option value="disabled" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Persons with Disability (৳4,75,000 exempt)' : 'প্রতিবন্ধী ব্যক্তি / তৃতীয় লিঙ্গ (৪,৭৫,০০০ টাকা করমুক্ত)'}
                  </option>
                  <option value="freedom_fighter" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Gazetted Freedom Fighter (৳5,00,000 exempt)' : 'গেজেটভুক্ত বীর মুক্তিযোদ্ধা (৫,০০,০০০ টাকা করমুক্ত)'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {language === 'en' ? 'Location (Minimum Tax)' : 'আবাসিক এলাকা (ন্যূনতম কর)'}
                </label>
                <select
                  value={locationZone}
                  onChange={(e) => setLocationZone(e.target.value as LocationZone)}
                  className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-primary focus:outline-none focus:border-accent/60"
                >
                  <option value="dhaka_ctg" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Dhaka / Chattogram City Corp (Min ৳5,000)' : 'ঢাকা ও চট্টগ্রাম সিটি কর্পোরেশন (ন্যূনতম ৫,০০০ টাকা)'}
                  </option>
                  <option value="other_city" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Other City Corporations (Min ৳4,000)' : 'অন্যান্য সিটি কর্পোরেশন (ন্যূনতম ৪,০০০ টাকা)'}
                  </option>
                  <option value="non_city" className="bg-bg-deep text-primary">
                    {language === 'en' ? 'Outside City Corp / District (Min ৳3,000)' : 'সিটি কর্পোরেশনের বাইরে / জেলা-উপজেলা (ন্যূনতম ৩,০০০ টাকা)'}
                  </option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 text-xs font-medium text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDisabledChild}
                    onChange={(e) => setHasDisabledChild(e.target.checked)}
                    className="w-4 h-4 rounded text-accent bg-glass border border-glass-border focus:ring-accent"
                  />
                  <span>
                    {language === 'en' 
                      ? 'Parent / Legal Guardian of disabled child (+৳50,000 limit)' 
                      : 'প্রতিবন্ধী সন্তানের পিতা/মাতা/অভিভাবক (+৫০,০০০ টাকা করমুক্ত সীমা)'}
                  </span>
                </label>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {language === 'en' ? 'Filing Status' : 'ট্যাক্স ফাইলিং স্ট্যাটাস'}
              </label>
              <select
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as any)}
                className="w-full bg-glass border border-glass-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-primary focus:outline-none focus:border-accent/60"
              >
                <option value="single" className="bg-bg-deep text-primary">
                  Single ($14,600 standard deduction)
                </option>
                <option value="married_joint" className="bg-bg-deep text-primary">
                  Married Filing Jointly ($29,200 standard deduction)
                </option>
                <option value="head_household" className="bg-bg-deep text-primary">
                  Head of Household ($21,900 standard deduction)
                </option>
              </select>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-white/5 border border-glass-border text-[11px] text-muted space-y-1 leading-relaxed">
            <p className="font-bold text-primary flex items-center gap-1.5">
              <Info size={13} className="text-accent" />
              {language === 'en' ? 'Statutory Reference:' : 'আইনগত তথ্যসূত্রঃ'}
            </p>
            <p>
              {taxSystem === 'bd_nbr' 
                ? (language === 'en' 
                    ? 'Income Tax Act 2023, National Board of Revenue (NBR), Bangladesh. Up to 1/3 of employment income or ৳4.5 Lakh is tax exempt.'
                    : 'আয়কর আইন ২০২৩, জাতীয় রাজস্ব বোর্ড (এনবিআর)। বেতন আয়ের ১/৩ অংশ অথবা ৪.৫০ লক্ষ টাকার মধ্যে যেটি কম তা করমুক্ত।')
                : 'IRS Federal Progressive Brackets & Standard Deduction Guidelines.'}
            </p>
          </div>
        </div>

        {/* Middle Column: Annual Incomes */}
        <div className="glass-card space-y-4">
          <h4 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-glass-border">
            <Building2 size={16} className="text-accent" />
            {language === 'en' ? 'Annual Inflow & Earnings' : 'বার্ষিক আয়ের বিবরণী'}
          </h4>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-muted">
                {language === 'en' ? 'Annual Employment / Salary *' : 'বার্ষিক বেতন ও ভাতাদি *'}
              </label>
              <span className="text-[10px] text-accent font-bold">
                {language === 'en' ? '1/3rd Exempt' : '১/৩ অংশ করমুক্ত'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={annualGrossSalary}
                onChange={(e) => setAnnualGrossSalary(e.target.value)}
                placeholder="600000"
                className="w-full bg-glass border border-glass-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {language === 'en' ? 'Business / Professional Income' : 'ব্যবসা অথবা পেশাগত আয়'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={annualBusinessIncome}
                onChange={(e) => setAnnualBusinessIncome(e.target.value)}
                placeholder="0"
                className="w-full bg-glass border border-glass-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {language === 'en' ? 'Other Incomes (House Property, Interest, etc.)' : 'অন্যান্য আয় (বাড়ি ভাড়া, সঞ্চয়পত্র মুনাফা ইত্যাদি)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={otherIncome}
                onChange={(e) => setOtherIncome(e.target.value)}
                placeholder="0"
                className="w-full bg-glass border border-glass-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent/60"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Tax Rebate & Investments */}
        <div className="glass-card space-y-4">
          <h4 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-glass-border">
            <Coins size={16} className="text-accent" />
            {language === 'en' ? 'Investment & Tax Rebate' : 'কর রেয়াত ও অনুমোদিত বিনিয়োগ'}
          </h4>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-muted">
                {language === 'en' ? 'Allowable Yearly Investment' : 'অনুমোদিত বিনিয়োগ পরিমাণ'}
              </label>
              <span className="text-[10px] text-emerald-400 font-bold">
                {language === 'en' ? '15% Tax Rebate' : '১৫% কর ছাড়'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="120000"
                className="w-full bg-glass border border-glass-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-primary focus:outline-none focus:border-accent/60"
              />
            </div>
            <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
              {language === 'en'
                ? 'DPS (up to ৳1.2L), Sanchayapatra, Life Insurance premium, approved Mutual Funds & Stock Market.'
                : 'ডিপিএস (সর্বোচ্চ ১.২ লক্ষ), সঞ্চয়পত্র, জীবন বীমা প্রিমিয়াম, অনুমোদিত শেয়ার ও মিউচুয়াল ফান্ড।'}
            </p>
          </div>

          {taxSystem === 'bd_nbr' && bdTaxCalculation.investmentRebate > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span>{language === 'en' ? 'Calculated Tax Rebate:' : 'বিনিয়োগের কর রেয়াতঃ'}</span>
                <span className="text-sm tabular-nums">-{currency}{formatNum(bdTaxCalculation.investmentRebate)}</span>
              </div>
              <p className="text-[10px] text-emerald-400/80">
                {language === 'en' 
                  ? `Saved 15% on eligible ${currency}${formatNum(bdTaxCalculation.eligibleInvestment)} investment.`
                  : `অনুমোদিত ${currency}${formatNum(bdTaxCalculation.eligibleInvestment)} বিনিয়োগের ওপর ১৫% কর হ্রাস পেয়েছে।`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Assessment Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Gross Income */}
        <div className="glass-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {language === 'en' ? 'Total Gross Income' : 'সর্বমোট বার্ষিক আয়'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-primary tabular-nums tracking-tight">
            {currency}{formatNum(activeResult.totalGross)}
          </div>
          <p className="text-[11px] text-muted">
            {language === 'en' ? 'Before exemptions & deductions' : 'করমুক্ত অংশ বাদে সম্পূর্ণ আয়'}
          </p>
        </div>

        {/* Card 2: Net Taxable Income */}
        <div className="glass-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {language === 'en' ? 'Net Taxable Income' : 'করযোগ্য নীট আয়'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 tabular-nums tracking-tight">
            {currency}{formatNum(activeResult.totalTaxableIncome)}
          </div>
          <p className="text-[11px] text-muted">
            {taxSystem === 'bd_nbr' 
              ? (language === 'en' 
                  ? `Exempted: ${currency}${formatNum(bdTaxCalculation.salaryExemption)} salary exemption` 
                  : `বেতন ছাড়: ${currency}${formatNum(bdTaxCalculation.salaryExemption)}`)
              : `Deduction: $${formatNum(usTaxCalculation.standardDeduction)}`}
          </p>
        </div>

        {/* Card 3: Final Tax Liability (Highlighted) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-accent/20 via-glass to-transparent border border-accent/40 shadow-xl space-y-2 relative overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <ShieldCheck size={14} />
            {language === 'en' ? 'Net Payable Tax (Year)' : 'প্রদেয় নীট বার্ষিক কর'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-accent tabular-nums tracking-tight">
            {currency}{formatNum(activeResult.finalTaxPayable)}
          </div>
          <p className="text-[11px] text-muted">
            {taxSystem === 'bd_nbr' && bdTaxCalculation.isMinTaxApplied
              ? (language === 'en' ? `Location Minimum Tax applied (${currency}${formatNum(bdTaxCalculation.minTax)})` : `ন্যূনতম কর ধার্য হয়েছে (${currency}${formatNum(bdTaxCalculation.minTax)})`)
              : (language === 'en' ? `Effective tax rate: ${activeResult.effectiveTaxRate.toFixed(2)}%` : `কার্যকর কর হার: ${activeResult.effectiveTaxRate.toFixed(2)}%`)}
          </p>
        </div>

        {/* Card 4: Recommended Monthly TDS / Savings */}
        <div className="glass-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Percent size={14} className="text-accent" />
            {language === 'en' ? 'Monthly Tax Provision (TDS)' : 'প্রতি মাসের প্রস্তাবিত কর সঞ্চয়'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums tracking-tight">
            {currency}{formatNum(activeResult.monthlyTDS)}
            <span className="text-xs font-normal text-muted ml-1">/ {language === 'en' ? 'mo' : 'মাস'}</span>
          </div>
          <p className="text-[11px] text-muted">
            {language === 'en' ? 'Set aside monthly to avoid year-end burden' : 'বছর শেষে চাপ এড়াতে প্রতি মাসে জমা রাখুন'}
          </p>
        </div>
      </div>

      {/* Progressive Tax Slabs Breakdown Table */}
      <div className="glass-card space-y-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowSlabDetails(p => !p)}>
          <div>
            <h4 className="font-bold text-base text-primary flex items-center gap-2">
              <FileText size={18} className="text-accent" />
              {language === 'en' ? 'Statutory Slab-by-Slab Calculation Breakdown' : 'সরকারী স্ল্যাবভিত্তিক কর হিসাবের বিস্তারিত তালিকা'}
            </h4>
            <p className="text-xs text-muted mt-0.5">
              {language === 'en'
                ? 'Shows exactly how your income travels through each tax bracket'
                : 'প্রতিটি ধাপে কত আয়ের ওপর কত শতাংশ কর আরোপিত হয়েছে তা দেখুন'}
            </p>
          </div>
          <button
            type="button"
            className="p-2 text-muted hover:text-primary rounded-xl transition-all"
          >
            {showSlabDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {showSlabDetails && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-muted uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">{language === 'en' ? 'Income Slab Bracket' : 'কর স্ল্যাব ও ধাপ'}</th>
                  <th className="py-3 px-3 text-center">{language === 'en' ? 'Tax Rate' : 'কর হার'}</th>
                  <th className="py-3 px-3 text-right">{language === 'en' ? 'Taxable Amount' : 'এই স্ল্যাবে আয়'}</th>
                  <th className="py-3 px-3 text-right">{language === 'en' ? 'Tax in Slab' : 'ধার্যকৃত কর'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/40 font-medium">
                {activeResult.slabs.map((slab, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-semibold text-primary">{slab.label}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold",
                        slab.rate === 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-accent/15 text-accent"
                      )}>
                        {slab.rate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-muted">
                      {currency}{formatNum(slab.taxableInSlab)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-primary">
                      {currency}{formatNum(slab.tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {taxSystem === 'bd_nbr' && (
                  <>
                    <tr className="border-t border-glass-border text-muted">
                      <td colSpan={3} className="py-2.5 px-3 font-bold text-right">
                        {language === 'en' ? 'Gross Tax on Slabs:' : 'স্ল্যাব অনুযায়ী মোট করঃ'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-primary tabular-nums">
                        {currency}{formatNum(bdTaxCalculation.grossTax)}
                      </td>
                    </tr>
                    {bdTaxCalculation.investmentRebate > 0 && (
                      <tr className="text-emerald-400">
                        <td colSpan={3} className="py-2 px-3 font-bold text-right">
                          {language === 'en' ? 'Less: Investment Tax Rebate (15%):' : 'বাদঃ বিনিয়োগ কর রেয়াত (১৫%):'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums">
                          -{currency}{formatNum(bdTaxCalculation.investmentRebate)}
                        </td>
                      </tr>
                    )}
                    {bdTaxCalculation.isMinTaxApplied && (
                      <tr className="text-amber-400 text-[11px]">
                        <td colSpan={3} className="py-2 px-3 font-medium text-right italic">
                          {language === 'en' ? `Adjusted to Statutory Minimum Tax (${locationZone}):` : `আইনগত ন্যূনতম কর সমন্বয় করা হয়েছে:`}
                        </td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums">
                          {currency}{formatNum(bdTaxCalculation.minTax)}
                        </td>
                      </tr>
                    )}
                  </>
                )}
                <tr className="border-t-2 border-accent/40 text-sm font-extrabold text-accent">
                  <td colSpan={3} className="py-3 px-3 text-right">
                    {language === 'en' ? 'Final Net Payable Tax:' : 'চূড়ান্ত প্রদেয় আয়করঃ'}
                  </td>
                  <td className="py-3 px-3 text-right text-base tabular-nums">
                    {currency}{formatNum(activeResult.finalTaxPayable)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Tax Saving & Smart Tips Banner */}
      <div className="p-5 rounded-2xl bg-glass border border-glass-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-accent/15 text-accent shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h5 className="font-bold text-sm text-primary">
              {language === 'en' ? 'Tax Planning Advice' : 'স্মার্ট কর সঞ্চয় পরামর্শ'}
            </h5>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              {taxSystem === 'bd_nbr' 
                ? (language === 'en'
                    ? `You can save up to 15% on investments up to ${currency}${formatNum(bdTaxCalculation.maxAllowableInvestment)} in approved DPS or Sanchayapatra.`
                    : `অনুমোদিত ডিপিএস অথবা সঞ্চয়পত্রে বার্ষিক ${currency}${formatNum(bdTaxCalculation.maxAllowableInvestment)} টাকা পর্যন্ত বিনিয়োগ করে ১৫% কর রেয়াত গ্রহণ করতে পারেন।`)
                : 'Consider maximizing IRA, 401(k), and HSA contributions to reduce your adjusted gross income.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const textToCopy = `TAX ASSESSMENT SUMMARY (${selectedYear})\nGross Income: ${currency}${formatNum(activeResult.totalGross)}\nTaxable Income: ${currency}${formatNum(activeResult.totalTaxableIncome)}\nFinal Tax Payable: ${currency}${formatNum(activeResult.finalTaxPayable)}\nMonthly TDS: ${currency}${formatNum(activeResult.monthlyTDS)}`;
            navigator.clipboard?.writeText(textToCopy);
            alert(language === 'en' ? 'Tax summary copied to clipboard!' : 'কর বিবরণী ক্লিপবোর্ডে কপি হয়েছে!');
          }}
          className="px-4 py-2 rounded-xl bg-glass hover:bg-white/5 border border-glass-border text-xs font-bold text-primary transition-all shrink-0"
        >
          {language === 'en' ? 'Copy Summary' : 'বিবরণী কপি করুন'}
        </button>
      </div>
    </div>
  );
}
