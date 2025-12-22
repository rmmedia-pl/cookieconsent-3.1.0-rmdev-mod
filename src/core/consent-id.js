/**
 * Consent ID Management
 * Generates and manages unique consent identifiers for users
 */

/**
 * Generate unique Consent ID (letters and numbers only)
 * @returns {string} Unique consent ID
 */
export const generateConsentId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return timestamp + random;
};

/**
 * Get or create Consent ID from localStorage
 * @returns {string} Consent ID
 */
export const getConsentId = () => {
    const storageKey = 'cc_consent_id';
    let consentId = localStorage.getItem(storageKey);
    
    if (!consentId) {
        consentId = generateConsentId();
        localStorage.setItem(storageKey, consentId);
    }
    
    return consentId;
};
