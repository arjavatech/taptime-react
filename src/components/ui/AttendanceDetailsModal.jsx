import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';

const AttendanceDetailsModal = ({ isOpen, onClose, record, formatTime }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [imageUrls, setImageUrls] = useState({
    checkIn: null,
    checkOut: null
  });

  // Debug logging and image proxy setup
  useEffect(() => {
    if (isOpen && record) {
      console.log("Modal record:", record);
      console.log('Modal opened with record:', {
        name: record.Name || record.name,
        check_in_snap: record.check_in_snap,
        check_out_snap: record.check_out_snap,
        CheckInSnap: record.CheckInSnap,
        CheckOutSnap: record.CheckOutSnap,
        record_id: record.record_id || record.RecordID
      });

      // Reset image error state and preview when opening a new record
      setImageLoadErrors({});
      setSelectedImage(null);

      // For S3 URLs, we'll load them directly
      // Check both snake_case and PascalCase variants
      const checkInUrl = record.check_in_snap || record.CheckInSnap;
      const checkOutUrl = record.check_out_snap || record.CheckOutSnap;
      
      console.log('Image URLs resolved:', {
        checkInUrl,
        checkOutUrl
      });

      setImageUrls({
        checkIn: checkInUrl,
        checkOut: checkOutUrl
      });
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  // Format time from timestamp
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '—';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timeString;
    }
  };

  const handleImageError = (photoId, error) => {
    console.error(`Image failed to load - ${photoId}:`, {
      error,
      url: imageUrls[photoId === 'checkin' ? 'checkIn' : 'checkOut'],
      errorMessage: error?.message
    });
    setImageLoadErrors(prev => ({
      ...prev,
      [photoId]: true
    }));
  };

  const handleImageLoad = (photoId) => {
    console.log(`Image loaded successfully - ${photoId}:`, imageUrls[photoId === 'checkin' ? 'checkIn' : 'checkOut']);
  };

  const openImagePreview = (photoUrl) => {
    setSelectedImage(photoUrl);
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop p-4">
        <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
          <CardHeader className="pb-4 px-4 sm:px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg md:text-xl">Attendance Details</CardTitle>
            <button
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all text-gray-600 hover:text-gray-900 border border-gray-200"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent className="space-y-6 px-4 sm:px-6">
            {/* Employee Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Employee Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Employee Name</p>
                  <p className="text-sm sm:text-base font-semibold">{record.Name || record.name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Employee ID / PIN</p>
                  <p className="text-sm sm:text-base font-semibold">{record.Pin || record.pin || record.EmpID || record.emp_id || '—'}</p>
                </div>
              </div>
            </div>

            {/* Attendance Times */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Attendance Times</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Check-in Time</p>
                  <p className="text-sm sm:text-base font-semibold">{formatTimeDisplay(record.check_in_time || record.CheckInTime)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Check-out Time</p>
                  <p className="text-sm sm:text-base font-semibold">{formatTimeDisplay(record.check_out_time || record.CheckOutTime) || '—'}</p>
                </div>
              </div>
            </div>

            {/* Attendance Type & Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Attendance Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Attendance Type</p>
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full font-medium">
                      {record.Type || record.type || '—'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Status</p>
                  <div>
                    <span className={`inline-block px-2.5 py-1 text-xs sm:text-sm rounded-full font-medium ${
                      (record.check_out_time || record.CheckOutTime)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(record.check_out_time || record.CheckOutTime) ? 'Checked Out' : 'Pending Checkout'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Worked */}
            {(record.TimeWorked || record.time_worked) && (record.TimeWorked || record.time_worked) !== '0:00' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Time Summary</h3>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Total Time Worked</p>
                  <p className="text-sm sm:text-base font-semibold">{record.TimeWorked || record.time_worked}</p>
                </div>
              </div>
            )}

            {/* Photos Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Photos</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Check-in Photo */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Check-in Photo</p>
                  <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => imageUrls.checkIn && openImagePreview(imageUrls.checkIn)}>
                    {imageUrls.checkIn && !imageLoadErrors['checkin'] ? (
                      <img
                        src={imageUrls.checkIn}
                        alt="Check-in photo"
                        className="w-full h-full object-cover"
                        onLoad={() => handleImageLoad('checkin')}
                        onError={(e) => handleImageError('checkin', e)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center px-1">
                          No photo
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Check-out Photo */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Check-out Photo</p>
                  <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => imageUrls.checkOut && openImagePreview(imageUrls.checkOut)}>
                    {imageUrls.checkOut && !imageLoadErrors['checkout'] ? (
                      <img
                        src={imageUrls.checkOut}
                        alt="Check-out photo"
                        className="w-full h-full object-cover"
                        onLoad={() => handleImageLoad('checkout')}
                        onError={(e) => handleImageError('checkout', e)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center px-1">
                          No photo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Modal / Lightbox */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '16px'
          }}
          onClick={closeImagePreview}
        >
          {/* Premium Preview Panel */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.3) inset',
              padding: '24px',
              maxWidth: '550px',
              maxHeight: '75vh',
              width: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Top-right of panel */}
            <button
              onClick={closeImagePreview}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
                e.target.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.target.style.transform = 'scale(1)';
              }}
              aria-label="Close image preview"
              title="Close image preview"
            >
              <X className="w-6 h-6" style={{ strokeWidth: '2.5px', color: '#1f2937' }} />
            </button>

            {/* Image Container with Padding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                maxWidth: '100%',
                maxHeight: 'calc(75vh - 48px)',
                marginTop: '8px'
              }}
            >
              <img
                src={selectedImage}
                alt="Full size preview"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '500px',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceDetailsModal;
