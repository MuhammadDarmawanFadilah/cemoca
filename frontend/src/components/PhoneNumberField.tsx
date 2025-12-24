"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { CountryCodeCombobox } from "@/components/CountryCodeCombobox";
import { COUNTRY_CALLING_CODES } from "@/lib/country-calling-codes";

export function toE164(countryCode: string, nationalNumber: string) {
  const cc = (countryCode || "").trim();
  const ccNormalized = cc.startsWith("+") ? cc : cc ? `+${cc}` : "";

  const digits = (nationalNumber || "").replace(/\D/g, "");
  if (!ccNormalized || !digits) return "";

  let national = digits;
  if (national.startsWith("0") && national.length > 1) {
    national = national.slice(1);
  }

  return `${ccNormalized}${national}`;
}

type Props = {
  countryCodeValue: string;
  onCountryCodeChange: (v: string) => void;
  numberValue: string;
  onNumberChange: (v: string) => void;
  countryCodePlaceholder?: string;
  numberPlaceholder?: string;
  defaultCountryCode?: string;
  disabled?: boolean;
  idPrefix?: string;
};

export function PhoneNumberField({
  countryCodeValue,
  onCountryCodeChange,
  numberValue,
  onNumberChange,
  countryCodePlaceholder = "Country code",
  numberPlaceholder = "Phone number",
  defaultCountryCode = "+62",
  disabled = false,
  idPrefix = "phone",
}: Props) {
  React.useEffect(() => {
    if (!countryCodeValue) {
      onCountryCodeChange(defaultCountryCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(140px,200px)_1fr]">
      <CountryCodeCombobox
        options={COUNTRY_CALLING_CODES}
        value={countryCodeValue}
        onValueChange={onCountryCodeChange}
        placeholder={countryCodePlaceholder}
        className="h-11"
        popoverClassName="max-h-[320px]"
      />
      <Input
        id={`${idPrefix}-number`}
        value={numberValue}
        onChange={(e) => onNumberChange(e.target.value)}
        placeholder={numberPlaceholder}
        className="h-11"
        inputMode="tel"
        disabled={disabled}
      />
    </div>
  );
}
