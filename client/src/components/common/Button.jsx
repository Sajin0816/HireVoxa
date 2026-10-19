import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#777777] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
    icon: 'p-2'
  };

  const variantStyles = {
    primary: 'bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#090909] font-semibold border border-[#F5F5F5]',
    secondary: 'bg-[#202020] hover:bg-[#282828] text-[#F5F5F5] border border-[#303030]',
    elevated: 'bg-[#171717] hover:bg-[#202020] text-[#F5F5F5] border border-[#303030]',
    outline: 'bg-transparent border border-[#303030] text-[#F5F5F5] hover:bg-[#171717] hover:border-[#404040]',
    ghost: 'bg-transparent text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717]',
    danger: 'bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
    </button>
  );
}
