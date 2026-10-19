import React from 'react';

// Custom SVGs matching the screenshot's distinctive tech chips
function PythonSvg({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M11.91 2C6.98 2 7.29 4.14 7.29 4.14L7.3 6.35H12V7.06H5.21C2.5 7.06 2 9.07 2 11.83C2 14.9 3.58 15.06 4.6 15.06H6.13V13.04C6.13 10.73 8.08 10.73 8.08 10.73H12.87C14.74 10.73 14.74 8.91 14.74 8.91V4.2C14.74 4.2 15.11 2 11.91 2ZM9.48 3.52C9.94 3.52 10.32 3.9 10.32 4.36C10.32 4.82 9.94 5.2 9.48 5.2C9.02 5.2 8.64 4.82 8.64 4.36C8.64 3.9 9.02 3.52 9.48 3.52Z"
        fill="#387EB8"
      />
      <path
        d="M12.09 22C17.02 22 16.71 19.86 16.71 19.86L16.7 17.65H12V16.94H18.79C21.5 16.94 22 14.93 22 12.17C22 9.1 20.42 8.94 19.4 8.94H17.87V10.96C17.87 13.27 15.92 13.27 15.92 13.27H11.13C9.26 13.27 9.26 15.09 9.26 15.09V19.8C9.26 19.8 8.89 22 12.09 22ZM14.52 20.48C14.06 20.48 13.68 20.1 13.68 19.64C13.68 19.18 14.06 18.8 14.52 18.8C14.98 18.8 15.36 19.18 15.36 19.64C15.36 20.1 14.98 20.48 14.52 20.48Z"
        fill="#FFE873"
      />
    </svg>
  );
}

function JavascriptSvg({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#F7DF1E" />
      <path
        d="M6.5 17.5L8.5 16.3C8.9 17.1 9.4 17.7 10.3 17.7C11.1 17.7 11.6 17.3 11.6 16.4V10.5H14.1V16.4C14.1 18.5 12.7 19.5 10.4 19.5C8.4 19.5 7.1 18.5 6.5 17.5ZM15.2 17.3L17.2 16.1C17.8 17.1 18.6 17.7 19.6 17.7C20.6 17.7 21.1 17.2 21.1 16.5C21.1 15.7 20.5 15.3 19.3 14.8L18.6 14.5C16.8 13.7 15.6 12.8 15.6 10.8C15.6 8.9 17.1 7.5 19.3 7.5C20.9 7.5 22.1 8.3 22.8 9.7L20.8 10.9C20.4 10.1 19.9 9.6 19.2 9.6C18.4 9.6 18 10 18 10.6C18 11.3 18.5 11.7 19.7 12.2L20.4 12.5C22.4 13.4 23.6 14.4 23.6 16.4C23.6 18.5 21.9 19.8 19.5 19.8C17.2 19.8 15.8 18.6 15.2 17.3Z"
        fill="#090909"
      />
    </svg>
  );
}

function ReactSvg({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="-11.5 -10.23174 23 20.46348">
      <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

function GenericCodeSvg({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export default function SkillIcon({ skill, showLabel = true, iconOnly = false, className = '' }) {
  const normalizedKey = (skill || '').trim().toLowerCase();

  let IconComponent = GenericCodeSvg;
  let label = skill;

  if (normalizedKey.includes('python')) {
    IconComponent = PythonSvg;
    label = 'Python';
  } else if (normalizedKey.includes('javascript') || normalizedKey === 'js') {
    IconComponent = JavascriptSvg;
    label = 'JavaScript';
  } else if (normalizedKey.includes('react')) {
    IconComponent = ReactSvg;
    label = 'React';
  }

  if (iconOnly) {
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#202020] border border-[#303030] shadow-sm ${className}`}
        title={skill}
      >
        <IconComponent className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#202020] border border-[#303030] text-[#F5F5F5] hover:border-[#404040] transition-colors ${className}`}
      title={skill}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
