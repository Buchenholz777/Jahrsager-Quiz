import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none transition-[background-color,color,box-shadow,transform,border-color] duration-200 select-none disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px whitespace-nowrap",
  {
    variants: {
      variant: {
        /** Primär: Mitternachtsblau mit heller Schrift */
        primary: "bg-ink text-paper shadow-[0_10px_22px_-12px_rgb(22_40_61/0.8)] hover:bg-ink-2 disabled:shadow-none",
        /** Gelb: nur mit dunkler Schrift (Kontrast ≈ 8:1) */
        sun: "bg-sun text-ink shadow-[0_10px_22px_-12px_rgb(224_143_26/0.9)] hover:bg-sun-2",
        secondary: "border-2 border-ink bg-card text-ink hover:bg-ink hover:text-paper",
        quiet: "bg-paper-2 text-ink hover:bg-line",
        ghost: "text-ink-soft hover:text-ink hover:bg-paper-2",
      },
      size: {
        md: "min-h-12 px-5 text-base",
        lg: "min-h-14 px-7 text-lg",
        sm: "min-h-11 px-4 text-sm",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
