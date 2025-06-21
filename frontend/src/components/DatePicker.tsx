import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  dateFormat = showTimeSelect ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd",
  minDate,
  maxDate,
  disabled = false,
}) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    )}
    <ReactDatePicker
      selected={value ? new Date(value) : null}
      onChange={date => onChange(date ? date.toISOString() : "")}
      className={className || "border rounded px-2 py-1"}
      showTimeSelect={showTimeSelect}
      dateFormat={dateFormat}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      placeholderText={label}
      isClearable
    />
  </div>
);

export default DatePicker;
