"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiSelectOption<T extends string> = {
  value: T;
  label: string;
};

type MultiSelectProps<T extends string> = {
  options: MultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  triggerClassName?: string;
  triggerSize?: "default" | "sm" | "lg" | "icon";
};

export function MultiSelect<T extends string>({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  disabled,
  triggerClassName,
  triggerSize = "default",
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selectedLabels = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label] as const));
    return value.map((v) => map.get(v) ?? v);
  }, [options, value]);

  const displayText = React.useMemo(() => {
    if (value.length === 0) return placeholder;
    if (selectedLabels.length <= 2) return selectedLabels.join(", ");
    return `${selectedLabels.length} selected`;
  }, [placeholder, selectedLabels, value.length]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={triggerSize}
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", triggerClassName)}
          disabled={disabled}
        >
          <span className={cn("truncate text-left", value.length === 0 && "text-muted-foreground")}>
            {displayText}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} disabled={disabled} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      const next = checked ? value.filter((v) => v !== opt.value) : [...value, opt.value];
                      onChange(next);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")} />
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
