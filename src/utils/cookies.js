import { globalObj } from '../core/global';
import { OPT_OUT_MODE, OPT_IN_MODE } from './constants';
import { manageExistingScripts } from './scripts';

import {
    debug,
    indexOf,
    uuidv4,
    getRemainingExpirationTimeMS,
    getExpiresAfterDaysValue,
    elContains,
    deepCopy,
    fireEvent,
    arrayDiff,
    safeRun,
    getCurrentCategoriesState
} from './general';
import { localStorageManager } from './localstorage';

const CATEGORY_MAP = {
    'necessary': 'n',
    'functionality': 'f',
    'analytics': 'a',
    'personalization': 'p',
    'marketing': 'm'
};

const CATEGORY_MAP_REVERSE = {
    'n': 'necessary',
    'f': 'functionality',
    'a': 'analytics',
    'p': 'personalization',
    'm': 'marketing'
};

const compressCookieData = (data) => {
    const compressed = {};
    
    if (data.categories) {
        compressed.c = data.categories.map(cat => CATEGORY_MAP[cat] || cat);
    }
    if (data.revision !== undefined) {
        compressed.r = data.revision;
    }
    if (data.data !== undefined && data.data !== null) {
        compressed.d = data.data;
    }
    if (data.consentTimestamp) {
        compressed.ct = typeof data.consentTimestamp === 'string' 
            ? Math.floor(new Date(data.consentTimestamp).getTime() / 1000)
            : Math.floor(data.consentTimestamp / 1000);
    }
    if (data.consentId) {
        compressed.id = data.consentId;
    }
    if (data.services) {
        const compressedServices = {};
        for (const cat in data.services) {
            const shortCat = CATEGORY_MAP[cat] || cat;
            if (data.services[cat] && data.services[cat].length > 0) {
                compressedServices[shortCat] = data.services[cat];
            }
        }
        if (Object.keys(compressedServices).length > 0) {
            compressed.s = compressedServices;
        }
    }
    if (data.languageCode) {
        compressed.l = data.languageCode;
    }
    if (data.lastConsentTimestamp) {
        compressed.lct = typeof data.lastConsentTimestamp === 'string'
            ? Math.floor(new Date(data.lastConsentTimestamp).getTime() / 1000)
            : Math.floor(data.lastConsentTimestamp / 1000);
    }
    if (data.expirationTime) {
        compressed.exp = Math.floor(data.expirationTime / 1000);
    }
    
    return compressed;
};

const expandCookieData = (compressed) => {
    if (!compressed || typeof compressed !== 'object') {
        return compressed;
    }
    
    if (compressed.categories !== undefined) {
        return compressed;
    }
    
    const expanded = {};
    
    if (compressed.c) {
        expanded.categories = compressed.c.map(cat => CATEGORY_MAP_REVERSE[cat] || cat);
    }
    if (compressed.r !== undefined) {
        expanded.revision = compressed.r;
    }
    if (compressed.d !== undefined) {
        expanded.data = compressed.d;
    } else {
        expanded.data = null;
    }
    if (compressed.ct) {
        expanded.consentTimestamp = new Date(compressed.ct * 1000).toISOString();
    }
    if (compressed.id) {
        expanded.consentId = compressed.id;
    }
    if (compressed.s) {
        expanded.services = {};
        for (const shortCat in compressed.s) {
            const fullCat = CATEGORY_MAP_REVERSE[shortCat] || shortCat;
            expanded.services[fullCat] = compressed.s[shortCat];
        }
    } else {
        expanded.services = {};
    }
    if (compressed.l) {
        expanded.languageCode = compressed.l;
    }
    if (compressed.lct) {
        expanded.lastConsentTimestamp = new Date(compressed.lct * 1000).toISOString();
    }
    if (compressed.exp) {
        expanded.expirationTime = compressed.exp * 1000;
    }
    
    return expanded;
};

const getCookieValue = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
};

const getGA4ClientId = () => {
    const ga = getCookieValue('_ga');
    if (ga) {
        const parts = ga.split('.');
        if (parts.length >= 4) {
            return parts.slice(2).join('.');
        }
    }
    return null;
};

const getGA4SessionId = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith('_ga_')) {
            const value = cookie.split('=')[1];
            if (value) {
                const parts = value.split('.');
                if (parts.length >= 3) {
                    return parts[2];
                }
            }
        }
    }
    return null;
};

const shouldWaitForGA4 = (acceptedCategories) => {
    const analyticsCategories = ['analytics', 'marketing', 'targeting'];
    return acceptedCategories.some(cat => 
        analyticsCategories.some(ac => cat.toLowerCase().includes(ac))
    );
};

const getGA4IdsWithRetry = async (maxRetries = 3, delayMs = 500) => {
    for (let i = 0; i < maxRetries; i++) {
        const clientId = getGA4ClientId();
        const sessionId = getGA4SessionId();
        
        if (clientId || sessionId) {
            return { clientId, sessionId };
        }
        
        if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    return { clientId: null, sessionId: null };
};

const pushToDataLayer = (consentId, event, acceptedCategories, rejectedCategories) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            'event': 'cc_info',
            'consent_id': consentId,
            'consent_event': event,
            'cookies': acceptedCategories,
            'accepted_categories': acceptedCategories,
            'rejected_categories': rejectedCategories
        });
        debug('CookieConsent: Pushed to dataLayer', { consent_id: consentId });
    }
};

export const logConsentToEndpoint = async (event) => {
    const config = globalObj._config;
    const { enabled, endpoint, usePreferHeader, waitForGA4 = true, pushToDataLayer: enableDataLayerPush = true } = config.consentLogging || {};

    if (!enabled || !endpoint) {
        return;
    }

    const state = globalObj._state;
    const { accepted, rejected } = getCurrentCategoriesState();
    const consentId = localStorageManager._getItem('cc_consent_id') || state._consentId;

    let ga4ClientId = null;
    let ga4SessionId = null;
    
    if (waitForGA4 && shouldWaitForGA4(accepted)) {
        const ga4Ids = await getGA4IdsWithRetry(3, 500);
        ga4ClientId = ga4Ids.clientId;
        ga4SessionId = ga4Ids.sessionId;
    } else {
        ga4ClientId = getGA4ClientId();
        ga4SessionId = getGA4SessionId();
    }

    if (enableDataLayerPush) {
        pushToDataLayer(consentId, event, accepted.join(', '), rejected.join(', '));
    }

    const consentData = {
        event: event,
        consent_id: consentId,
        accept_type: state._acceptType || '',
        accepted_categories: accepted.join(', '),
        rejected_categories: rejected.join(', '),
        ga4_client_id: ga4ClientId,
        ga4_session_id: ga4SessionId,
        user_agent: navigator.userAgent,
        hostname: window.location.hostname,
        page_url: window.location.href
    };

    debug(`CookieConsent [${event}] Consent data:`, consentData);

    const headers = {
        'Content-Type': 'application/json'
    };

    if (usePreferHeader) {
        headers['Prefer'] = 'return=minimal';
    }

    fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(consentData),
        keepalive: true
    })
    .then(r => {
        if (!r.ok) {
            debug(`CookieConsent [${event}] Error: ${r.status} ${r.statusText}`);
        } else {
            debug(`CookieConsent [${event}] Saved:`, r.status);
        }
    })
    .catch(e => debug(`CookieConsent [${event}] Error:`, e));
};

/**
 * @param {boolean} [isFirstConsent]
 */
const getCategoriesWithCookies = (isFirstConsent) => {
    const state = globalObj._state;

    const categoriesToFilter = isFirstConsent
        ? state._allCategoryNames
        : state._lastChangedCategoryNames;

    /**
     * Filter out categories with readOnly=true or don't have an autoClear object
     */
    return categoriesToFilter.filter(categoryName => {
        const currentCategoryObject = state._allDefinedCategories[categoryName];

        return !!currentCategoryObject
            && !currentCategoryObject.readOnly
            && !!currentCategoryObject.autoClear;
    });
};

/**
 * @param {string[]} allCookies
 * @param {string} cookieName
 */
const findMatchingCookies = (allCookies, cookieName) => {
    if (cookieName instanceof RegExp) {
        return allCookies.filter(cookie => cookieName.test(cookie));
    } else {
        const cookieIndex = indexOf(allCookies, cookieName);
        return cookieIndex > -1
            ? [allCookies[cookieIndex]]
            : [];
    }
};

/**
 * Delete all unused cookies
 * @param {boolean} [isFirstConsent]
 */
export const autoclearCookiesHelper = (isFirstConsent) => {
    const state = globalObj._state;
    const allCookiesArray = getAllCookies();
    const categoriesToClear = getCategoriesWithCookies(isFirstConsent);

    /**
     * Clear cookies for each disabled service
     */
    for (const categoryName in state._lastChangedServices) {
        for (const serviceName of state._lastChangedServices[categoryName]) {
            const serviceCookies = state._allDefinedServices[categoryName][serviceName].cookies;
            const serviceIsDisabled = !elContains(state._acceptedServices[categoryName], serviceName);

            if (!serviceIsDisabled || !serviceCookies)
                continue;

            for (const cookieItem of serviceCookies) {
                const foundCookies = findMatchingCookies(allCookiesArray, cookieItem.name);
                eraseCookiesHelper(foundCookies, cookieItem.path, cookieItem.domain);
            }
        }
    }

    for (const currentCategoryName of categoriesToClear) {
        const category = state._allDefinedCategories[currentCategoryName];
        const autoClear = category.autoClear;
        const autoClearCookies = autoClear && autoClear.cookies || [];

        const categoryWasJustChanged = elContains(state._lastChangedCategoryNames, currentCategoryName);
        const categoryIsDisabled = !elContains(state._acceptedCategories, currentCategoryName);
        const categoryWasJustDisabled = categoryWasJustChanged && categoryIsDisabled;

        const shouldClearCookies = isFirstConsent
            ? categoryIsDisabled
            : categoryWasJustDisabled;

        if (!shouldClearCookies)
            continue;

        if (autoClear.reloadPage && categoryWasJustDisabled)
            state._reloadPage = true;

        for (const cookieItem of autoClearCookies) {
            const foundCookies = findMatchingCookies(allCookiesArray, cookieItem.name);
            eraseCookiesHelper(foundCookies, cookieItem.path, cookieItem.domain);
        }
    }
};

export const saveCookiePreferences = () => {
    const state = globalObj._state;

    /**
     * Determine if categories were changed from last state (saved in the cookie)
     */
    state._lastChangedCategoryNames = globalObj._config.mode === OPT_OUT_MODE && state._invalidConsent
        ? arrayDiff(state._defaultEnabledCategories, state._acceptedCategories)
        : arrayDiff(state._acceptedCategories, state._savedCookieContent.categories);

    let categoriesWereChanged = state._lastChangedCategoryNames.length > 0;
    let servicesWereChanged = false;

    /**
     * Determine if services were changed from last state
     */
    for (const categoryName of state._allCategoryNames) {
        state._lastChangedServices[categoryName] = arrayDiff(
            state._acceptedServices[categoryName],
            state._lastEnabledServices[categoryName]
        );

        if (state._lastChangedServices[categoryName].length > 0)
            servicesWereChanged = true;
    }

    //{{START: GUI}}
    const categoryToggles = globalObj._dom._categoryCheckboxInputs;

    /**
     * If the category is accepted check checkbox,
     * otherwise uncheck it
     */
    for (const categoryName in categoryToggles) {
        categoryToggles[categoryName].checked = elContains(state._acceptedCategories, categoryName);
    }

    for (const categoryName of state._allCategoryNames) {
        const servicesToggles = globalObj._dom._serviceCheckboxInputs[categoryName];
        const enabledServices = state._acceptedServices[categoryName];

        for (const serviceName in servicesToggles) {
            const serviceInput = servicesToggles[serviceName];
            serviceInput.checked = elContains(enabledServices, serviceName);
        }
    }
    //{{END: GUI}}

    if (!state._consentTimestamp)
        state._consentTimestamp = new Date();

    if (!state._consentId)
        state._consentId = uuidv4();

    state._savedCookieContent = {
        categories: deepCopy(state._acceptedCategories),
        revision: globalObj._config.revision,
        data: state._cookieData,
        consentTimestamp: state._consentTimestamp.toISOString(),
        consentId: state._consentId,
        services: deepCopy(state._acceptedServices),
        languageCode: globalObj._state._currentLanguageCode
    };

    if (state._lastConsentTimestamp) {
        state._savedCookieContent.lastConsentTimestamp = state._lastConsentTimestamp.toISOString();
    }

    let isFirstConsent = false;
    const stateChanged = categoriesWereChanged || servicesWereChanged;

    if (state._invalidConsent || stateChanged) {
        /**
         * Set consent as valid
         */
        if (state._invalidConsent) {
            state._invalidConsent = false;
            isFirstConsent = true;
        }

        state._lastConsentTimestamp = !state._lastConsentTimestamp
            ? state._consentTimestamp
            : new Date();

        state._savedCookieContent.lastConsentTimestamp = state._lastConsentTimestamp.toISOString();

        setCookie();

        const isAutoClearEnabled = globalObj._config.autoClearCookies;
        const shouldClearCookies = isFirstConsent || stateChanged;

        if (isAutoClearEnabled && shouldClearCookies)
            autoclearCookiesHelper(isFirstConsent);

        manageExistingScripts();
    }

    if (isFirstConsent) {
        logConsentToEndpoint('first_consent');
        fireEvent(globalObj._customEvents._onFirstConsent);
        fireEvent(globalObj._customEvents._onConsent);

        if (globalObj._config.mode === OPT_IN_MODE)
            return;
    }

    if (stateChanged) {
        fireEvent(globalObj._customEvents._onChange);
        logConsentToEndpoint('consent_update');
    }

    /**
     * Reload page if needed
     */
    if (state._reloadPage) {
        state._reloadPage = false;
        location.reload();
    }
};

/**
 * Set plugin's cookie
 * @param {boolean} [useRemainingExpirationTime]
 */
export const setCookie = (useRemainingExpirationTime) => {
    const { hostname, protocol } = location;
    const { name, path, domain, sameSite, useLocalStorage, secure } = globalObj._config.cookie;

    const expiresAfterMs = useRemainingExpirationTime
        ? getRemainingExpirationTimeMS()
        : getExpiresAfterDaysValue()*86400000;

    /**
     * Expiration date
     */
    const date = new Date();
    date.setTime(date.getTime() + expiresAfterMs);

    /**
     * Store the expiration date in the cookie (in case localstorage is used)
     */

    globalObj._state._savedCookieContent.expirationTime = date.getTime();

    const compressedContent = compressCookieData(globalObj._state._savedCookieContent);
    const value = JSON.stringify(compressedContent);

    /**
     * Encode value (RFC compliant)
     */
    const cookieValue = encodeURIComponent(value);

    let cookieStr = name + '='
        + cookieValue
        + (expiresAfterMs !== 0 ? '; expires=' + date.toUTCString() : '')
        + '; Path=' + path
        + '; SameSite=' + sameSite;

    /**
     * Set "domain" only if hostname contains a dot (e.g domain.com)
     * to ensure that cookie works with 'localhost'
     */
    if (elContains(hostname, '.'))
        cookieStr += '; Domain=' + domain;

    if (secure && protocol === 'https:')
        cookieStr += '; Secure';

    useLocalStorage
        ? localStorageManager._setItem(name, value)
        : document.cookie = cookieStr;

    debug('CookieConsent [SET_COOKIE]: ' + name + ':', globalObj._state._savedCookieContent);
};

/**
 * Parse cookie value using JSON.parse
 * @param {string} value
 */
export const parseCookie = (value, skipDecode) => {
    /**
     * @type {import('../../types').CookieValue}
     */
    let parsedValue;

    parsedValue = safeRun(() => JSON.parse(skipDecode
        ? value
        : decodeURIComponent(value)
    ), true) || {};

    return expandCookieData(parsedValue);
};

/**
 * Delete cookie by name & path
 * @param {string[]} cookies Array of cookie names
 * @param {string} [customPath]
 * @param {string} [customDomain]
 */
export const eraseCookiesHelper = (cookies, customPath, customDomain) => {
    if (cookies.length === 0)
        return;

    const domain = customDomain || globalObj._config.cookie.domain;
    const path = customPath || globalObj._config.cookie.path;
    const isWwwSubdomain = domain.slice(0, 4) === 'www.';
    const mainDomain = isWwwSubdomain && domain.substring(4);

    /**
     * Helper function to erase cookie
     * @param {string} cookie
     * @param {string} [domain]
     */
    const erase = (cookie, domain) => {
        if (domain && domain.slice(0, 1) !== '.')
            domain = '.' + domain;
        document.cookie = cookie + '='
            + '; path=' + path
            + (domain ? '; domain=' + domain : '')
            + '; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    };

    for (const cookieName of cookies) {
        erase(cookieName, customDomain);

        /**
         * If custom domain not specified,
         * also erase config domain
         */
        if (!customDomain) {
            erase(cookieName, domain);
        }

        /**
         * If domain starts with 'www.',
         * also erase the cookie for the
         * main domain (without www)
         */
        if (isWwwSubdomain)
            erase(cookieName, mainDomain);

        debug('CookieConsent [AUTOCLEAR]: deleting cookie: "' + cookieName + '" path: "' + path + '" domain:', domain);
    }
};

/**
 * Get plugin cookie
 * @param {string} [customName]
 */
export const getPluginCookie = (customName) => {
    const name = customName || globalObj._config.cookie.name;
    const useLocalStorage = globalObj._config.cookie.useLocalStorage;
    const valueStr = useLocalStorage
        ? localStorageManager._getItem(name)
        : getSingleCookie(name, true);
    return parseCookie(valueStr, useLocalStorage);
};

/**
 * Returns the cookie name/value, if it exists
 * @param {string} name
 * @param {boolean} getValue
 * @returns {string}
 */
export const getSingleCookie = (name, getValue) => {
    const found = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');

    return found
        ? (getValue ? found.pop() : name)
        : '';
};

/**
 * Returns array with all the cookie names
 * @param {RegExp} regex
 * @returns {string[]}
 */
export const getAllCookies = (regex) => {
    const allCookies = document.cookie.split(/;\s*/);

    /**
     * @type {string[]}
     */
    const cookieNames = [];

    /**
     * Save only the cookie names
     */
    for (const cookie of allCookies) {
        let name = cookie.split('=')[0];

        if (regex) {
            safeRun(() => {
                regex.test(name) && cookieNames.push(name);
            });
        } else {
            cookieNames.push(name);
        }
    }

    return cookieNames;
};
