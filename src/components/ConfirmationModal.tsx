import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, X, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'destructive' | 'primary' | 'success' | 'warning';
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
  variant = 'destructive',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonClass: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white',
          glowClass: 'shadow-red-500/20',
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          buttonClass: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white',
          glowClass: 'shadow-green-500/20',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          buttonClass: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white',
          glowClass: 'shadow-amber-500/20',
        };
      default:
        return {
          icon: Info,
          iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonClass: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
          glowClass: 'shadow-blue-500/20',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const IconComponent = variantStyles.icon;

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isAnimating
          ? 'bg-black/60 backdrop-blur-sm'
          : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/20 dark:border-gray-700/30 transition-all duration-200 ${
          isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
        } ${variantStyles.glowClass} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 rounded-2xl pointer-events-none" />
        
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* Icon and content */}
          <div className="flex items-start gap-6">
            <div className={`flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl ${variantStyles.iconBg} transition-all duration-300 hover:scale-105`}>
              <IconComponent 
                className={`h-8 w-8 ${variantStyles.iconColor} transition-all duration-300`} 
                aria-hidden="true" 
              />
            </div>
            
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                {title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {cancelText}
            </button>
            
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[120px] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${variantStyles.buttonClass}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Processando...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>

        {/* Bottom glow effect */}
        <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-gradient-to-r ${
          variant === 'destructive' ? 'from-transparent via-red-500/20 to-transparent' :
          variant === 'success' ? 'from-transparent via-green-500/20 to-transparent' :
          variant === 'warning' ? 'from-transparent via-amber-500/20 to-transparent' :
          'from-transparent via-blue-500/20 to-transparent'
        } blur-xl`} />
      </div>
    </div>
  );
};

export default ConfirmationModal;