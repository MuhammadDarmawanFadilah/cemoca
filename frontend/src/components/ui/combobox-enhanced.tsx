"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  onBlur?: () => void;
  required?: boolean;
}

export function Combobox({
  options,
  value,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  onValueChange,
  disabled = false,
  className,
  name,
  onBlur,
  required = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedOption = options?.find((option) => option.value === value);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options?.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    ) || [];
  }, [options, searchValue]);
  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setSearchValue("");
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-all duration-200",
            !selectedOption && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
          name={name}
          onBlur={onBlur}
          aria-required={required}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border border-border/50" 
        align="start"
        sideOffset={4}
      >        <Command className="rounded-lg border-0">
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
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-4 w-4 opacity-50" />
                <span>{emptyMessage}</span>
              </div>
            </CommandEmpty>
            <CommandGroup className="p-1">
              {filteredOptions?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange?.(option.value === value ? "" : option.value);
                    setOpen(false);
                    setSearchValue("");
                  }}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
