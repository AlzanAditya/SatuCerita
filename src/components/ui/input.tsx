import React, { forwardRef } from "react";

export interface InputBaseProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  tooltip?: string;
  error?: boolean;
}

export const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
  ({ className = "", tooltip, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);

InputBase.displayName = "InputBase";
export default InputBase;
