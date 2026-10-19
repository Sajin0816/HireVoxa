import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm'
  };

  const variantStyles = {
    default: 'bg-[#202020] text-[#D4D4D4] border border-[#303030]',
    neutral: 'bg-[#171717] text-[#A3A3A3] border border-[#303030]',
    success: 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30',
    warning: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30',
    error: 'bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30',
    open: 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30',
    trial: 'bg-[#202020] text-[#E0E0E0] border border-[#303030]',
    fulfilled: 'bg-[#171717] text-[#777777] border border-[#303030]',
    onhold: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30',
    draft: 'bg-[#171717] text-[#777777] border border-[#303030]'
  };

  const chosenVariant = variantStyles[variant.toLowerCase()] || variantStyles.default;
  const chosenSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span className={`${baseStyles} ${chosenSize} ${chosenVariant} ${className}`}>
      {children}
    </span>
  );
}
