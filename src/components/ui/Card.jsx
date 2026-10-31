'use client';

import React from 'react';

export const Card = ({
  children,
  variant = 'default', // 'default' (white) | 'canvas' (#FAF8F5) | 'muted' (#F4F1EA) | 'dark' (#1C1917)
  hoverLift = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-white dark:bg-[#1C1917] border-[#E7E3D9] dark:border-neutral-800 text-[#1C1917] dark:text-[#FAF8F5]',
    canvas:
      'bg-[#FAF8F5] dark:bg-[#151311] border-[#E7E3D9] dark:border-neutral-800 text-[#1C1917] dark:text-[#FAF8F5]',
    muted:
      'bg-[#F4F1EA] dark:bg-neutral-900 border-[#E7E3D9] dark:border-neutral-800 text-[#1C1917] dark:text-[#FAF8F5]',
    dark:
      'bg-[#1C1917] border-[#292524] text-[#FAF8F5]',
  };

  const liftStyles = hoverLift
    ? 'transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-700'
    : 'transition-colors';

  return (
    <div
      className={`border rounded-xl shadow-[0_1px_3px_rgba(28,25,23,0.03)] ${
        variantStyles[variant] || variantStyles.default
      } ${liftStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div
    className={`px-5 py-4 border-b border-[#E7E3D9] dark:border-neutral-800 flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div
    className={`px-5 py-3.5 border-t border-[#E7E3D9] dark:border-neutral-800 bg-[#FAF8F5]/50 dark:bg-neutral-900/40 rounded-b-xl flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
