import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';

const AttendanceDetailsModal = ({ isOpen, onClose, record, formatTime }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewType, setImagePreviewType] = useState(null); // 'checkin' or 'checkout'
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

  const openImagePreview = (photoUrl, type = 'checkin') => {
    setSelectedImage(photoUrl);
    setImagePreviewType(type);
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
    setImagePreviewType(null);
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
                  <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => imageUrls.checkIn && openImagePreview(imageUrls.checkIn, 'checkin')}>
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
                  <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => imageUrls.checkOut && openImagePreview(imageUrls.checkOut, 'checkout')}>
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

      {/* Image Preview Modal - Matches Reference Design */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            backgroundColor: 'rgba(100, 100, 100, 0.5)',
            padding: '16px'
          }}
          onClick={closeImagePreview}
        >
          {/* Modal Card */}
          <div
            style={{
              position: 'relative',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              padding: '32px 24px 24px',
              maxWidth: '500px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#000000',
              textAlign: 'center',
              width: '100%'
            }}>
              {imagePreviewType === 'checkout' ? 'Check-out photo' : 'Check-in photo'}
            </div>

            {/* Close Button - Top-right */}
            <button
              onClick={closeImagePreview}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                transition: 'background-color 0.2s ease',
                padding: '0'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#e5e7eb';
              }}
              aria-label="Close image preview"
              title="Close"
            >
              <X className="w-5 h-5" style={{ strokeWidth: '2px', color: '#374151' }} />
            </button>

            {/* Image Container */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxHeight: '400px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6'
              }}
            >
              <img
                src={selectedImage}
                alt={imagePreviewType === 'checkout' ? 'Check-out photo' : 'Check-in photo'}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={closeImagePreview}
              style={{
                backgroundColor: '#001f3f',
                color: '#ffffff',
                border: 'none',
                padding: '10px 32px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#003d5c';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#001f3f';
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceDetailsModal;
