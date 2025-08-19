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
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
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
