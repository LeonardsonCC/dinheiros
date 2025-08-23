"use client"

import React from "react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export type DatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
};

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  className,
  minDate,
  maxDate,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth());
    }
    return new Date();
  });

  // Parse the ISO string to a Date object
  const selectedDate = value ? new Date(value) : undefined;

  // Get the appropriate locale based on current language
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'pt-BR':
        return ptBR;
      case 'en':
      default:
        return enUS;
    }
  };

  // Get the appropriate date format based on locale
  const getDateFormat = () => {
    switch (i18n.language) {
      case 'pt-BR':
        return 'dd/MM/yyyy'; // Brazilian format
      case 'en':
      default:
        return 'MM/dd/yyyy'; // US format
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to ISO string for consistency with existing code
      onChange(date.toISOString());
    } else {
      onChange("");
    }
    setOpen(false);
  };

  // Generate months array for the select
  const months = React.useMemo(() => {
    const monthsArray = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(2024, i, 1); // Use any year for month names
      monthsArray.push({
        value: i,
        label: format(date, 'MMMM', { locale: getDateLocale() }),
      });
    }
    return monthsArray;
  }, [i18n.language]);

  // Generate years array for the select
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = minDate ? minDate.getFullYear() : currentYear - 30;
    const endYear = maxDate ? maxDate.getFullYear() : currentYear + 10;

    const yearsArray = [];
    for (let year = startYear; year <= endYear; year++) {
      yearsArray.push(year);
    }
    return yearsArray;
  }, [minDate, maxDate]);

  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    const newDate = new Date(month.getFullYear(), parseInt(newMonth));
    setMonth(newDate);
  };

  // Handle year change
  const handleYearChange = (newYear: string) => {
    const newDate = new Date(parseInt(newYear), month.getMonth());
    setMonth(newDate);
  };

  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{t(label)}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarDaysIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, getDateFormat(), { locale: getDateLocale() })
            ) : (
              <span>{t("newTransaction.pickDate")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex gap-2">
              <Select value={month.getMonth().toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((monthItem) => (
                    <SelectItem key={monthItem.value} value={monthItem.value.toString()}>
                      {monthItem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={month.getFullYear().toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            locale={getDateLocale()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
