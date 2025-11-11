import React, { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  inputStyle?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
};

export default function DatePicker({ value, onChange, inputStyle, className, ariaLabel }: Props) {
  const [iso, setIso] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setIso("");
      return;
    }
    // expect value like DD.MM.YYYY or YYYY-MM-DD
    const dmy = value.match(/^(\d{2})[.\-/](\d{2})[.\-/](\d{4})$/);
    if (dmy) {
      const [, dd, mm, yyyy] = dmy;
      setIso(`${yyyy}-${mm}-${dd}`);
      return;
    }
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      setIso(value);
      return;
    }
    setIso("");
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; // yyyy-mm-dd or ''
    setIso(v);
    if (!v) {
      onChange("");
      return;
    }
    const parts = v.split("-");
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      onChange(`${dd}.${mm}.${yyyy}`);
    } else {
      onChange("");
    }
  };

  return (
    <input
      type="date"
      aria-label={ariaLabel || "date"}
      value={iso}
      onChange={handle}
      className={className}
      style={inputStyle}
    />
  );
}
