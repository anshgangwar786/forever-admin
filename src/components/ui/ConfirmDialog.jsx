'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  description = 'Are you sure you want to proceed? This action may not be reversible.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertCircle className="w-5 h-5 text-[#8E2824]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#8C581E]" />,
    primary: <Info className="w-5 h-5 text-[#B08D57]" />,
  };

  const bgClasses = {
    danger: 'bg-[#FAECEB] dark:bg-[#3D1A18] text-[#8E2824]',
    warning: 'bg-[#FAF2E6] dark:bg-[#382613] text-[#8C581E]',
    primary: 'bg-[#F7F3EB] dark:bg-[#2C2318] text-[#B08D57]',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full shrink-0 ${bgClasses[variant]}`}>
          {icons[variant]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base font-semibold text-[#1C1917] dark:text-[#FAF8F5]">
            {title}
          </h3>
          <p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#E7E3D9] dark:border-[#292524]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          loading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
