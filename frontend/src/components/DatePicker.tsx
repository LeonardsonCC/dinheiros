import React from "react";

type DatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, className }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className || "border rounded px-2 py-1"}
    />
  </div>
);

export default DatePicker;
