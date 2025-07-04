import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export type DatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
};

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  className,
  showTimeSelect = false,
  dateFormat = showTimeSelect ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy",
  minDate,
  maxDate,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const getCalendarContainer = ({ children }: { children: React.ReactNode[] }) => {
    return (
      <div className={theme === 'dark' ? 'dark-theme' : 'light-theme'}>
        {children}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t(label)}</label>
      )}
      <ReactDatePicker
        selected={value ? new Date(value) : null}
        onChange={date => onChange(date ? date.toISOString() : "")}
        className={className || "w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2 px-3"}
        showTimeSelect={showTimeSelect}
        dateFormat={dateFormat}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        placeholderText={label ? t(label) : undefined}
        isClearable
        calendarContainer={getCalendarContainer}
      />
    </div>
  );
};

export default DatePicker;
