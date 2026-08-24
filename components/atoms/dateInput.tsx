import React, { FC, KeyboardEvent } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Add this CSS directly in your component file
const datePickerStyles = `
  .react-datepicker-wrapper {
    width: 100% !important;
  }
  .react-datepicker__input-container {
    width: 100% !important;
  }
  .react-datepicker__input-container input {
    width: 100% !important;
  }
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  #root-datepicker-portal {
    position: relative;
    z-index: 9999;
  }
`;

interface AinputProps {
  title: string;
  type?: string;
  name: string;
  redlabel?: string;
  handleInputChange: (name: string, value: string) => void;
  required?: boolean;
  value?: string | number | null;
  readOnly?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
  max?: number | string;
  isHighlight?: number | string;
  index?: number;
  idx?: number;
  isCompact?: boolean;
  isBlackLabel?: boolean;
  isIndexedDate?: boolean;
  highZIndex?: boolean;
  attenDtl?: string;
}

const AinputDate: FC<AinputProps> = ({
  title,
  name,
  handleInputChange,
  required = false,
  value = null,
  readOnly = false,
  redlabel = "",
  errorMessage = "",
  disabled = false,
  className = "",
  max,
  isHighlight,
  index,
  isBlackLabel = false,
  idx,
  isCompact = false,
  isIndexedDate = false,
  highZIndex = true, // ✅ default true so calendar always renders correctly
  attenDtl
}) => {
  const handleChange = (name: string, date: Date | null) => {
    if (!date) {
      handleInputChange(name, "");
      return;
    }

    const now = new Date();
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const pad = (n: number) => (n < 10 ? "0" + n : n);
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

    handleInputChange(name, formatted);
  };

  const formatDateInput = (input: string): string => {
    const clean = input.replace(/[^\d]/g, "");
    if (clean.length === 6) {
      const day = clean.slice(0, 2);
      const month = clean.slice(2, 4);
      const year = `20${clean.slice(4, 6)}`;
      return `${year}/${month}/${day}`;
    } else if (clean.length === 8) {
      const day = clean.slice(0, 2);
      const month = clean.slice(2, 4);
      const year = clean.slice(4);
      return `${year}/${month}/${day}`;
    } else if (clean.length === 4) {
      const day = clean.slice(0, 2);
      const month = clean.slice(2, 4);
      const year = new Date().getFullYear();
      return `${year}/${month}/${day}`;
    }
    return clean;
  };

  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!regex.test(dateString)) return false;
    const [year, month, day] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      const inputValue = event.currentTarget.value;
      if (!inputValue.trim()) return;
      const date = formatDateInput(inputValue);
      if (isValidDate(date)) {
        const [year, month, day] = date.split("/").map(Number);
        const dateObject = new Date(year, month - 1, day);
        if (isIndexedDate) {
          handleInputChange(index, idx, name, dateObject);
        } else {
          handleChange(name, dateObject);
        }
      } else {
        handleChange(name, null);
      }
    }
  };

  const parseDateValue = (value: string | number | null): Date | null => {
    if (!value) return null;
    return new Date(String(value));
  };

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="relative w-full">
      <style>{datePickerStyles}</style>
      <label
        className={`flex items-center whitespace-nowrap ${
          isBlackLabel
            ? "text-black dark:text-white"
            : "text-[#193A69] dark:text-[#E2E8F0]"
        } ${isCompact ? "text-xs" : attenDtl || "text-xs"}font-bold ${
          isCompact ? "" : "mt-1 mb-1"
        }`}
        htmlFor={name}
      >
        {toTitleCase(title)}
        {redlabel && (
          <span className="text-red-500 text-xs ml-2">{redlabel}</span>
        )}
        {errorMessage && (
          <span className="text-red-500 text-xs ml-2">{errorMessage}</span>
        )}
      </label>

      <div className="w-full">
        <DatePicker
          selected={parseDateValue(value)}
          onChange={(date: Date | null) => {
            if (isIndexedDate) {
              handleInputChange(index, idx, name, date);
            } else {
              handleChange(name, date);
            }
          }}
          dateFormat="dd/MM/yyyy"
          onKeyDown={handleKeyDown}
          portalId={highZIndex ? "root-datepicker-portal" : undefined}
          popperProps={
            highZIndex
              ? { strategy: "fixed", style: { zIndex: 9999 } }
              : undefined
          }
          popperPlacement="bottom-start"
          className={`z-20 border border-[#b5bfcb] dark:border-[#D0D5DD]
            flex ${isCompact ? "h-8 w-28 text-xs" : "h-9 w-full text-sm"} rounded-md dark:bg-input bg-white px-3 py-1 text-sm
            shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm
            file:font-medium placeholder:text-slate-500 focus-visible:outline-none
            focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed
            disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400
            dark:focus-visible:ring-slate-300 ${className}
            ${isHighlight ? "ring-2 ring-yellow-400" : ""}
          `}
          wrapperClassName="w-full"
          disabled={disabled}
          placeholderText="DD/MM/YYYY"
          readOnly={readOnly}
          required={required}
          maxDate={max ? new Date(max) : undefined}
        />
      </div>
    </div>
  );
};
export default AinputDate;
