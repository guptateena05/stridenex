import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Loader2, X } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  isLoggingOut: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  isLoggingOut,
  onClose,
  onConfirm
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={!isLoggingOut ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-5 ring-8 ring-red-50/50">
                  <LogOut className="w-8 h-8 ml-1" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Sign Out</h2>
                <p className="text-[15px] leading-relaxed text-slate-500 mb-8 font-medium px-4">
                  Are you sure you want to sign out? You'll need to log in again to access your dashboard.
                </p>
                
                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={onConfirm}
                    disabled={isLoggingOut}
                    className="w-full h-14 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-[16px] font-bold text-[15px] flex items-center justify-center transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow shadow-red-500/20"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      "Yes, sign me out"
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isLoggingOut}
                    className="w-full h-14 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-[16px] font-bold text-[15px] flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              disabled={isLoggingOut}
              className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
