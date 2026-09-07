import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Download, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  isLoading: boolean;
  title?: string;
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export function OfferLetterModal({
  isOpen,
  onClose,
  pdfUrl,
  isLoading,
  title = "Offer Letter",
  onAccept,
  onReject,
  isAccepting,
  isRejecting
}: OfferLetterModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">Please review your offer letter carefully</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - PDF Viewer */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative min-h-[400px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
              <p className="font-medium">Generating your offer letter...</p>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`} 
              className="w-full h-full border-0"
              title="Offer Letter PDF"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <p className="font-medium">Failed to load offer letter.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             {pdfUrl && (
                <Button 
                  variant="outline" 
                  className="gap-2 text-slate-600 font-medium"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = pdfUrl;
                    a.download = "Offer_Letter.pdf";
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
             )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={onReject}
              disabled={isLoading || isAccepting || isRejecting}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-6"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject Offer
            </Button>
            
            <Button 
              onClick={onAccept}
              disabled={isLoading || isAccepting || isRejecting || !pdfUrl}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-sm"
            >
              {isAccepting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Accept Offer
            </Button>
          </div>
        </div>
        
      </div>
    </div>,
    document.body
  );
}
