'use client';

import React from 'react';

export const Skeleton = ({
  variant = 'rectangular', // 'text' | 'circular' | 'rectangular' | 'card'
  width,
  height,
  className = '',
  ...props
}) => {
  const baseClasses = 'skeleton-shimmer dark:bg-[#252220] rounded-sm';

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} rounded-full shrink-0 ${className}`}
        style={{ ...style, width: width || height || '40px', height: height || width || '40px' }}
        {...props}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div
        className={`${baseClasses} h-3.5 my-1 rounded-xs ${className}`}
        style={style}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`border border-[#E7E3D9] dark:border-[#292524] rounded-xl p-4 bg-white dark:bg-[#1C1917] space-y-3 ${className}`}
        {...props}
      >
        <div className="skeleton-shimmer dark:bg-[#252220] h-48 w-full rounded-md" />
        <div className="skeleton-shimmer dark:bg-[#252220] h-4 w-3/4 rounded-xs" />
        <div className="skeleton-shimmer dark:bg-[#252220] h-3 w-1/2 rounded-xs" />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={style}
      {...props}
    />
  );
};

export default Skeleton;
