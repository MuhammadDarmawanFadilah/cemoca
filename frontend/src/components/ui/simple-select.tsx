"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface SimpleSelectProps {
  options: { value: string; label: string }[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  name?: string;
  onBlur?: () => void;
}

export function SimpleSelect({
  options,
  value,
  placeholder = "Select option...",
  onChange,
  className,
  disabled = false,
  name,
  onBlur,
}: SimpleSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={`w-full justify-between ${className}`}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        name={name}
        onBlur={onBlur}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <span className="ml-2">▼</span>
      </Button>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100"
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
