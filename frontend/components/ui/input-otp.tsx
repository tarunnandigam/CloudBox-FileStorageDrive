"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputOTPProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ value = "", onChange, disabled = false, className }, ref) => {
    const [otp, setOtp] = React.useState(value.split(""));
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
      setOtp(value.split("").concat(Array(6 - value.length).fill("")));
    }, [value]);

    const handleChange = (index: number, val: string) => {
      if (disabled) return;
      
      const newOtp = [...otp];
      newOtp[index] = val.slice(-1);
      setOtp(newOtp);
      onChange?.(newOtp.join(""));

      if (val && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (disabled) return;
      
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    return (
      <div ref={ref} className={cn("flex gap-1 sm:gap-2 justify-center", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 text-center border border-input bg-background text-foreground rounded-md text-base sm:text-lg font-semibold",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        ))}
      </div>
    );
  }
);

InputOTP.displayName = "InputOTP";

export { InputOTP };