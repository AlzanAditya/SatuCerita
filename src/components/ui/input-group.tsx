import React from "react";

export interface InputGroupProps {
  label?: string;
  isRequired?: boolean;
  hint?: string;
  leadingAddon?: React.ReactNode;
  trailingAddon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  error?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> & {
  Prefix: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }>;
  Suffix: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }>;
} = ({
  label,
  isRequired,
  hint,
  leadingAddon,
  trailingAddon,
  children,
  className = "",
  error,
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-text-primary flex items-center gap-1">
          <span>{label}</span>
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div
        className={`flex items-center rounded-xl bg-white border transition-all duration-200 overflow-hidden shadow-2xs ${
          error
            ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20"
            : "border-neutral-200/90 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20"
        }`}
      >
        {leadingAddon}
        <div className="flex-1 min-w-0 flex items-center">{children}</div>
        {trailingAddon}
      </div>

      {hint && <p className="text-[11px] text-text-secondary leading-tight mt-0.5">{hint}</p>}
    </div>
  );
};

const Prefix: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = "",
  style,
}) => {
  return (
    <span
      style={style}
      className={`inline-flex items-center px-3 sm:px-3.5 py-2.5 bg-neutral-50/90 text-neutral-500 text-xs sm:text-sm font-medium border-r border-neutral-200/80 shrink-0 select-none ${className}`}
    >
      {children}
    </span>
  );
};

const Suffix: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = "",
  style,
}) => {
  return (
    <span
      style={style}
      className={`inline-flex items-center px-3 sm:px-3.5 py-2.5 bg-neutral-50/90 text-neutral-500 text-xs sm:text-sm font-medium border-l border-neutral-200/80 shrink-0 select-none ${className}`}
    >
      {children}
    </span>
  );
};

InputGroup.Prefix = Prefix;
InputGroup.Suffix = Suffix;

export default InputGroup;
