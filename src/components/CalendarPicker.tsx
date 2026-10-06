import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
  language?: 'en' | 'bn';
}

const toBanglaNumerals = (num: number | string) => {
  const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(char => {
    const index = enDigits.indexOf(char);
    return index !== -1 ? bnDigits[index] : char;
  }).join('');
};

export function CalendarPicker({ selectedDate, onSelect, language = 'en' }: CalendarPickerProps) {
  // Ensure we have a valid date block, if invalid default to today
  const safeDate = useMemo(() => {
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  }, [selectedDate]);

  const [currentMonth, setCurrentMonth] = useState(safeDate.getMonth());
  const [currentYear, setCurrentYear] = useState(safeDate.getFullYear());

  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const months = language === 'bn' ? monthsBn : monthsEn;

  // Dynamically build dropdown years
  const years = useMemo(() => {
    const list = [];
    const base = new Date().getFullYear();
    for (let y = base - 25; y <= base + 15; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const startDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  const prevMonthDays = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentMonth, currentYear]);

  const gridCells = useMemo(() => {
    const cells = [];
    
    // 1. Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      let m = currentMonth - 1;
      let y = currentYear;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // 2. Current Month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // 3. Next month days padding (6 complete rows of 7 days)
    const totalNeeded = 42;
    const currentLength = cells.length;
    const padding = totalNeeded - currentLength;
    for (let d = 1; d <= padding; d++) {
      let m = currentMonth + 1;
      let y = currentYear;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    return cells;
  }, [currentMonth, currentYear, daysInMonth, startDayOfWeek, prevMonthDays]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const isSelected = (day: number, m: number, y: number) => {
    return safeDate.getDate() === day && safeDate.getMonth() === m && safeDate.getFullYear() === y;
  };

  return (
    <div className="glass border border-glass-border rounded-2xl p-4 bg-bg-deep shadow-2xl pointer-events-auto min-w-[280px] text-primary">
      {/* Selector Controls */}
      <div className="flex justify-between items-center gap-2 mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-white/5 text-primary border border-white/5 hover:border-white/10 transition-all cursor-pointer duration-150"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-2 items-center">
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg pl-3 pr-6 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent/50 appearance-none cursor-pointer transition-all"
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx} className="bg-bg-deep text-primary">
                  {m}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-primary opacity-60"></div>
          </div>

          <div className="relative">
            <select
              value={currentYear}
              onChange={(e) => {
                const targetYear = Number(e.target.value);
                if (!isNaN(targetYear)) {
                  setCurrentYear(targetYear);
                }
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg pl-3 pr-6 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent/50 appearance-none cursor-pointer transition-all"
            >
              {years.map(y => (
                <option key={y} value={y} className="bg-bg-deep text-primary">
                  {language === 'bn' ? toBanglaNumerals(y) : y}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-primary opacity-60"></div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/5 text-primary border border-white/5 hover:border-white/10 transition-all cursor-pointer duration-150"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 text-center gap-1 mb-2">
        {(language === 'bn' 
          ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'] 
          : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        ).map((w, idx) => (
          <span key={idx} className="text-[10px] font-bold text-faint uppercase tracking-widest py-1 opacity-75">
            {w}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-primary">
        {gridCells.map((cell, idx) => {
          const selected = isSelected(cell.day, cell.month, cell.year);
          const currentDay = isToday(cell.day, cell.month, cell.year);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelect(new Date(cell.year, cell.month, cell.day));
              }}
              className={`
                text-xs py-2 rounded-lg transition-all duration-150 focus:outline-none cursor-pointer w-full text-center
                ${!cell.isCurrentMonth ? 'text-faint opacity-30 hover:bg-white/5' : ''}
                ${cell.isCurrentMonth && !selected && !currentDay ? 'text-primary hover:bg-accent/20 hover:text-white' : ''}
                ${currentDay && !selected ? 'border border-accent text-accent' : ''}
                ${selected ? 'bg-accent text-white font-bold shadow-md shadow-accent/20 scale-105' : ''}
              `}
            >
              {language === 'bn' ? toBanglaNumerals(cell.day) : cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
