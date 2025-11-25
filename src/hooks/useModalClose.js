import { useEffect } from 'react';

/**
 * Custom hook to handle modal closing on outside click and ESC key press
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when modal should close
 * @param {string} modalId - Optional ID of the modal element for more specific targeting
 */
export const useModalClose = (isOpen, onClose, modalId = null) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      // If modalId is provided, check if click is outside that specific modal
      if (modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement && !modalElement.contains(event.target)) {
          onClose();
        }
      } else {
        // Generic approach: check if clicked element has modal backdrop classes
        if (event.target.classList.contains('modal-backdrop') || 
            event.target.classList.contains('bg-black/50')) {
          onClose();
        }
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, modalId]);
};