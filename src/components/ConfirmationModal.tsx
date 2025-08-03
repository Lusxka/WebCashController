// src/components/ConfirmationModal.tsx

import React from 'react';
import { Loader2, AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = isDestructive ? 'btn-danger' : 'btn-primary';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-900/20' : 'bg-primary-100 dark:bg-primary-900/20'}`}>
              <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`} aria-hidden="true" />
            </div>
            <div className="mt-0 text-left flex-1">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </button>
            <button type="button" className={`${confirmButtonClasses} min-w-[100px] flex justify-center`} onClick={onConfirm} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;