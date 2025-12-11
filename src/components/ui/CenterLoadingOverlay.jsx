import React from 'react';
import { Loader2 } from 'lucide-react';

const CenterLoadingOverlay = ({ show, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="font-medium text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default CenterLoadingOverlay;