// ZIP code lookup utility using Zippopotam.us API (US only)
const ZIPPOPOTAMUS_BASE_URL = 'https://api.zippopotam.us/us';

/**
 * Fetches city and state information for a US ZIP code
 * @param {string} zipCode - 5-digit US ZIP code
 * @returns {Promise<{city: string, state: string} | null>}
 */
export const lookupZipCode = async (zipCode) => {
  // Validate input - must be exactly 5 digits
  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    return null;
  }

  try {
    const response = await fetch(`${ZIPPOPOTAMUS_BASE_URL}/${zipCode}`);

    // 404 means ZIP code not found
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Extract first place (ZIP codes can span multiple places)
    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      return {
        city: place['place name'],
        state: place['state abbreviation'] // Returns "CA", "NY", etc.
      };
    }

    return null;
  } catch (error) {
    console.error('ZIP code lookup error:', error);
    return null; // Fail silently - don't block form
  }
};
