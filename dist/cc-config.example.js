/**
 * CookieConsent Configuration Example
 * 
 * This is a complete example configuration for CookieConsent with:
 * - BigQuery consent logging via Cloud Function
 * - GA4 integration with smart retry mechanism
 * - DataLayer push with cc_info event
 * - Google Consent Mode v2 integration
 * - Auto-clear cookies configuration
 * 
 * @version 3.1.0-rmdev-2.4
 */

// Configuration variables
const mainDomain = '.example.com';
const privacyPolicyUrl = '/privacy-policy';
const contactUrl = '/contact';

// Initialize dataLayer for GTM/GA4
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

/**
 * Send consent preferences to dataLayer
 * This function updates Google Consent Mode and pushes cc_info event
 */
function sendPreferences() {
    // Map CookieConsent categories to Google Consent Mode
    const categories = {
        analytics_storage: 'analytics',
        functionality_storage: 'necessary',
        personalization_storage: 'personalization',
        security_storage: 'necessary',
        ad_storage: 'marketing',
        ad_user_data: 'marketing',
        ad_personalization: 'marketing',
    };

    // Build consent object
    const consents = Object.entries(categories).reduce((acc, [key, category]) => {
        acc[key] = CookieConsent.acceptedCategory(category) ? 'granted' : 'denied';
        return acc;
    }, {});

    // Update Google Consent Mode
    gtag('consent', 'update', consents);

    // Optional: Push individual category events
    ['analytics', 'personalization', 'marketing', 'necessary'].forEach(category => {
        if (CookieConsent.acceptedCategory(category)) {
            const eventMap = {
                analytics: 'cc_analytics',
                personalization: 'cc_personalization',
                marketing: 'cc_marketing',
                necessary: 'cc_functionality'
            };
            window.dataLayer.push({
                event: eventMap[category]
            });
        }
    });
}

// Initialize CookieConsent
CookieConsent.run({
   
    // GUI options
    guiOptions: {
        consentModal: {
            layout: "box wide",
            position: "middle center",
            equalWeightButtons: false,
            flipButtons: false
        },
        preferencesModal: {
            layout: "bar wide",
            position: "left",
            equalWeightButtons: false,
            flipButtons: true
        }
    },
    
    // Cookie options
    cookie: {
        name: 'cc_cookie',
        domain: mainDomain,
        path: '/',
        expiresAfterDays: 182,
        sameSite: 'Lax',
        secure: true
    },
    
    // Consent logging configuration
    // Logs to BigQuery via Cloud Function with GA4 integration
    consentLogging: {
        enabled: true,
        endpoint: 'https://your-domain.com/ccdata',  // Your nginx proxy endpoint
        waitForGA4: true,           // Smart retry for GA4 IDs (default: true)
        pushToDataLayer: true       // Auto-push cc_info to dataLayer (default: true)
    },    

    // Update dataLayer on consent events
    onConsent: function() {
        sendPreferences();
        console.log('CookieConsent [onConsent] Preferences sent to dataLayer');
    },

    onChange: function({ changedCategories }) {
        sendPreferences();
        console.log('CookieConsent [onChange] Changed:', changedCategories);
    },
    
    // Categories with auto-clear configuration
    categories: {
        necessary: {
            enabled: true,
            readOnly: true
        },
        analytics: {
            autoClear: {
                cookies: [
                    { name: /^_ga/ },
                    { name: '_gid' },
                    { name: '_gat' },
                    { name: /^_gtmeec/ },
                    { name: /^utm_/ }
                ]
            }
        },
        personalization: {},
        marketing: {
            autoClear: {
                cookies: [
                    { name: /^_gcl/ },
                    { name: /^_fbp/ },
                    { name: '_fbc' },
                    { name: 'IDE', domain: '.doubleclick.net' },
                    { name: 'NID', domain: '.google.com' }
                ]
            }
        }
    },

    // Language configuration
    language: {
        default: 'en',
        autoDetect: 'browser',
        translations: {
            en: {
                consentModal: {
                    title: 'We use cookies',
                    description: 'We use cookies to personalize content and ads, provide social media features, and analyze our traffic.',
                    acceptAllBtn: 'Accept all',
                    acceptNecessaryBtn: 'Reject all',
                    showPreferencesBtn: 'Manage preferences',
                    footer: `<a href="${privacyPolicyUrl}">Privacy Policy</a>`
                },
                preferencesModal: {
                    title: 'Cookie Preferences',
                    acceptAllBtn: 'Accept all',
                    acceptNecessaryBtn: 'Reject all',
                    savePreferencesBtn: 'Save preferences',
                    sections: [
                        {
                            title: 'Cookie Usage',
                            description: `We use cookies to enhance your browsing experience. <a href="${privacyPolicyUrl}">Privacy Policy</a>`
                        },
                        {
                            title: 'Strictly Necessary Cookies <span class="pm__badge">Always Enabled</span>',
                            description: 'These cookies are essential for the website to function properly.',
                            linkedCategory: 'necessary'
                        },
                        {
                            title: 'Analytics Cookies',
                            description: 'These cookies help us understand how visitors interact with our website.',
                            linkedCategory: 'analytics'
                        },
                        {
                            title: 'Personalization Cookies',
                            description: 'These cookies allow us to remember your preferences and settings.',
                            linkedCategory: 'personalization'
                        },
                        {
                            title: 'Marketing Cookies',
                            description: 'These cookies are used to deliver relevant advertisements.',
                            linkedCategory: 'marketing'
                        },
                        {
                            title: 'More Information',
                            description: `For any questions about our cookie policy, please <a href="${contactUrl}">contact us</a>.`
                        }
                    ]
                }
            }
        }
    }
});
