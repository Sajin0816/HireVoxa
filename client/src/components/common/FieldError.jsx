import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable FieldError Component
 * Displays a lightweight, accessible inline validation error message matching Hirevoxa's design system.
 *
 * @param {string} id - HTML ID for aria-describedby linkage
 * @param {string} error - Error message string to render (or pass via message)
 * @param {string} message - Error message string to render (alias for error)
 * @param {string} className - Optional additional CSS classes
 */
export default function FieldError({ id, error, message, className = '' }) {
  const text = error || message;
  if (!text) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={`text-xs text-[#EF4444] mt-1.5 flex items-center gap-1.5 transition-all duration-150 ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#EF4444]" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}
