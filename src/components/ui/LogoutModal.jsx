import React from 'react';

const LogoutModal = ({ isOpen, onClose, onConfirm, userName = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full transform scale-100 transition-all">
        {/* Header */}
        <div className="bg-[#02066F] text-white p-4 rounded-t-xl text-center">
          <h3 className="text-lg font-bold">Sign Out</h3>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <p className="text-gray-800 font-semibold mb-2">
            Are you sure you want to sign out?
          </p>
          {userName && (
            <p className="text-sm text-gray-500 mb-4">
              Signed in as {userName}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 text-white bg-[#02066F] rounded-lg font-medium hover:bg-[#030974] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;