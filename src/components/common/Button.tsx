
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none";
    
    const variantClasses = {
      primary: "bg-xBlue hover:bg-opacity-90 text-white focus-visible:ring-xBlue",
      secondary: "bg-xExtraLightGray hover:bg-opacity-90 text-xDark focus-visible:ring-xExtraLightGray",
      outline: "border border-xExtraLightGray hover:bg-xExtraLightGray hover:bg-opacity-10 text-foreground focus-visible:ring-xExtraLightGray",
      ghost: "hover:bg-xExtraLightGray hover:bg-opacity-10 text-foreground focus-visible:ring-xExtraLightGray",
    };
    
    const sizeClasses = {
      sm: "text-xs px-3 py-1.5 rounded-full",
      md: "text-sm px-4 py-2 rounded-full",
      lg: "text-base px-5 py-2.5 rounded-full",
      icon: "p-2 rounded-full"
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          isLoading && "opacity-70 pointer-events-none",
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-current"></div>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
