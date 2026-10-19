import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className = '' }) {
  return (
    <div className={`bg-[#171717] border border-[#303030] rounded-2xl p-5 hover:border-[#404040] transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[#777777]">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#F5F5F5]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-[#777777]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
