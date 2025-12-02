"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface WilayahComboboxProps {
  options: ComboboxOption[];
  value?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  name?: string;
  onBlur?: () => void;
  required?: boolean;
}

export function WilayahCombobox({
  options,
  value,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  onValueChange,
  disabled = false,
  loading = false,
  className,
  name,
  onBlur,
  required = false,
}: WilayahComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedOption = options?.find((option) => option.value === value);

  // Filter options based on search with improved performance
  const filteredOptions = React.useMemo(() => {
    if (!searchValue || !options) return options || [];
    
    const search = searchValue.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(search) ||
      option.value.toLowerCase().includes(search)
    );
  }, [options, searchValue]);

  // Close and reset search when disabled
  React.useEffect(() => {
    if (disabled) {
      setOpen(false);
      setSearchValue("");
    }
  }, [disabled]);

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue;
    onValueChange?.(newValue);
    setOpen(false);
    setSearchValue("");
  };

  const displayText = loading ? placeholder : (selectedOption ? selectedOption.label : placeholder);

  return (
    <Popover open={open && !disabled} onOpenChange={(isOpen) => {
      if (!disabled) {
        setOpen(isOpen);
        if (!isOpen) {
          setSearchValue("");
        }
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-all duration-200",
            !selectedOption && !loading && "text-muted-foreground",
            (disabled || loading) && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled || loading}
          name={name}
          onBlur={onBlur}
          aria-required={required}
        >
          <span className="truncate flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {displayText}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border border-border/50" 
        align="start"
        sideOffset={4}
      >
        <Command className="rounded-lg border-0" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length === 0 && !loading ? (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-4 w-4 opacity-50" />
                  <span>{searchValue ? `Tidak ada hasil untuk "${searchValue}"` : emptyMessage}</span>
                </div>
              </CommandEmpty>
            ) : null}
            
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat data...</span>
                </div>
              </div>
            ) : (
              <CommandGroup className="p-1">
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-sm",
                      "cursor-pointer select-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      "transition-colors duration-150"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 transition-opacity duration-150",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
