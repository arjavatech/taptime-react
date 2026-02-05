import React, { useState } from 'react';

/**
 * Avatar component that displays user profile images with Gmail address fallback
 * 
 * When no profile image is available during Google login, displays the first letter 
 * of the user's Gmail address as the avatar.
 * 
 * @param {string} src - Profile image URL
 * @param {string} email - User's email address (used for fallback letter)
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {string} className - Additional CSS classes
 * @param {string} alt - Alt text for the image
 */
const Avatar = ({ 
  src, 
  email, 
  size = 'md', 
  className = '',
  alt = 'Profile'
}) => {
  const [imageError, setImageError] = useState(false);
  
  
  // Extract first letter from Gmail address for fallback
  const getFallbackLetter = (emailAddress) => {
    if (!emailAddress || typeof emailAddress !== 'string') return '?';
    return emailAddress.charAt(0).toUpperCase();
  };

  // Size variants
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const fallbackLetter = getFallbackLetter(email);

  // Show fallback if no src, image error, or src is empty/null
  const showFallback = !src || imageError || (typeof src === 'string' && src.trim() === '');
  

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden ${className}`}>
      {showFallback ? (
        <div className="h-full w-full bg-[#02066F] flex items-center justify-center">
          <span className="font-medium text-white">{fallbackLetter}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={() => {
            console.log('Image failed to load:', src);
            setImageError(true);
          }}
         
        />
      )}
    </div>
  );
};

export default Avatar;