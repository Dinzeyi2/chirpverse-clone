
import React from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', isLoading = false, className, children, ...props }, ref) => {
    // Map the 'primary' variant to 'default' for shadcn/ui button
    const mappedVariant = variant === 'primary' ? 'default' : variant;
    
    return (
      <ShadcnButton
        ref={ref}
        variant={mappedVariant as any}
        size={size}
        className={cn(isLoading && "opacity-70 pointer-events-none", className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {children}
      </ShadcnButton>
    );
  }
);

Button.displayName = "Button";

export default Button;
