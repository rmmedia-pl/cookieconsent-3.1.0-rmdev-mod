import "../../dist/cc.umd.js";

// Define URLs once
const mainDomain = '.falelokikoki.pl';
const privacyPolicyUrl = '/privacy-policy';
const contactUrl = '/contact';

// NOTE: Default consent state should be set in init script BEFORE GTM loads
// This file only handles consent UPDATES after user interaction

// Ensure gtag is available (should be defined in init script)
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

// Send preferences to dataLayer - called on consent/change
function sendPreferences() {
    const categories = {
        analytics_storage: 'analytics',
        functionality_storage: 'necessary',
        personalization_storage: 'personalization',
        security_storage: 'necessary',
        ad_storage: 'marketing',
        ad_user_data: 'marketing',
        ad_personalization: 'marketing',
    };

    const consents = Object.entries(categories).reduce((acc, [key, category]) => {
        acc[key] = CookieConsent.acceptedCategory(category) ? 'granted' : 'denied';
        return acc;
    }, {});

    gtag('consent', 'update', consents);

    // DataLayer events
    window.dataLayer.push({
        event: 'cc_info',
        cookies: CookieConsent.getUserPreferences().acceptedCategories.join(','),
    });

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

CookieConsent.run({
   
    // Base URL for assets (logo, etc.) when hosted on different domain
    // baseUrl: 'https://your-cdn.com/cookie-consent',
    
    // GUI options
    guiOptions: {
        consentModal: {
            layout: "box wide",
            position: "middle center",
            equalWeightButtons: false,
            flipButtons: false,
            showCloseButton: false,
            showLogo: true
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
        name: 'cc_status',
        domain: mainDomain,
        path: '/',
        expiresAfterDays: 999,
        sameSite: 'None',
        secure: true,
        useLocalStorage: false
    },
    manageScriptTags: false,
    disablePageInteraction: true,
    closeIconLabel: '',
    
    // Consent logging configuration
    consentLogging: {
        enabled: true,
        endpoint: 'https://cc.flkpro.com/ccdata'
    },

    // Consent Mode v2 - update dataLayer on consent change
    onConsent: function() {
        sendPreferences();
        console.log('CookieConsent [onConsent] Preferences sent to dataLayer');
    },

    onChange: function({ changedCategories }) {
        sendPreferences();
        console.log('CookieConsent [onChange] Preferences updated, changed:', changedCategories);
    },
    
    // Cookies categories
    categories: {
        necessary: {
            enabled: true,
            readOnly: true
        },
        functionality: {},
        analytics: {
            autoClear: {
                cookies: [
                    { name: /^_ga/ },
                    { name: '_gid' },
                    { name: '_gat' },
                    { name: /^_cl/ },
                    { name: 'MUID', domain: '.clarity.ms' },
                    { name: 'ANONCHK', domain: '.c.clarity.ms' },
                    { name: 'MR', domain: '.c.clarity.ms' },
                    { name: 'SM', domain: '.c.clarity.ms' },
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
                    { name: /^_ttp/ },
                    { name: '_tt_enable_cookie' },
                    { name: '_uetsid' },
                    { name: '_uetvid' },
                    { name: 'IDE', domain: '.doubleclick.net' },
                    { name: 'test_cookie', domain: '.doubleclick.net' },
                    { name: 'NID', domain: '.google.com' },
                    { name: '1P_JAR', domain: '.google.com' },
                    { name: 'VISITOR_INFO1_LIVE', domain: '.youtube.com' },
                    { name: 'YSC', domain: '.youtube.com' },
                    { name: 'VISITOR_PRIVACY_METADATA', domain: '.youtube.com' }
                ]
            }
        }
    },

    // Language configuration
    language: {
        default: 'pl',
        autoDetect: false,
        translations: {
            pl: {
                consentModal: {
                    title: 'Ciasteczko? Ta strona używa plików cookie',
                    description: 'Używamy plików cookie w celu personalizacji treści, reklam i analizy naszego ruchu. Udostępniamy również informacje o tym, jak korzystasz z naszej witryny, naszym partnerom reklamowym i analitycznym, którzy mogą łączyć je z innymi informacjami, które im przekazałeś lub które zebrali w wyniku korzystania przez Ciebie z ich usług.',
                    acceptAllBtn: 'Akceptuję wszystkie',
                    acceptNecessaryBtn: 'Odrzucam',
                    showPreferencesBtn: 'Dostosuj preferencje',
                    closeIconLabel: 'Zamknij',
                    consentIdLabel: 'ID zgody',
                    footer: `<a href="${privacyPolicyUrl}">Polityka prywatności</a>`
                },
                preferencesModal: {
                    title: 'Ciasteczko? Ta strona używa plików cookie',
                    acceptAllBtn: 'Akceptuję wszystkie',
                    acceptNecessaryBtn: 'Odrzucam',
                    savePreferencesBtn: 'Zapisz wybrane',
                    consentIdLabel: 'ID zgody',
                    sections: [
                        {
                            title: 'Zarządzaj plikami cookie',
                            description: `Używamy plików cookie w celu personalizacji treści, reklam i analizy naszego ruchu. Udostępniamy również informacje o tym, jak korzystasz z naszej witryny, naszym partnerom reklamowym i analitycznym, którzy mogą łączyć je z innymi informacjami, które im przekazałeś lub które zebrali w wyniku korzystania przez Ciebie z ich usług.<br><br><a href="${privacyPolicyUrl}">Polityka prywatności</a>`
                     }, {
                            title: 'Niezbędne pliki cookie <span class="pm__badge">Zawsze włączone</span>',
                            description: 'Ten rodzaj plików cookie jest niezbędny do prawidłowego funkcjonowania strony internetowej. Zazwyczaj są one używane tylko w odpowiedzi do działań podejmowanych przez użytkownika, takich jak ustawienie opcji prywatności lub wypełnianie formularzy. Możesz zmienić ustawienia swojej przeglądarki tak, aby je zablokować lub otrzymywać ostrzeżenia o tych plikach, jednak niektóre elementy strony nie będą wtedy działać. Ten rodzaj plików cookie nie przechowuje żadnych danych osobowych.',
                            linkedCategory: 'necessary',
                            cookieTable: {
                                caption: 'Niezbędne pliki cookie',
                                headers: {
                                    name: 'Nazwa',
                                    domain: 'Domena',
                                    expiration: 'Wygaśnięcie',
                                    desc: 'Opis'
                                },
                                body: [
                                    {
                                        name: 'cc_status',
                                        domain: mainDomain,
                                        expiration: '1 rok',
                                        desc: 'Przechowuje preferencje użytkownika dotyczące zgody na pliki cookie. Niezbędny do prawidłowego działania banera cookie.'
                                    },
                                    {
                                        name: 'FPGSID',
                                        domain: mainDomain,
                                        expiration: '30 minut',
                                        desc: 'Zachowuje stan sesji użytkownika na wszystkich żądaniach stron. Niezbędny do prawidłowego funkcjonowania strony.'
                                    },
                                    {
                                        name: 'cc_consent_id',
                                        domain: mainDomain,
                                        expiration: '1 rok',
                                        desc: 'Przechowuje unikalny identyfikator zgody użytkownika (consent ID) do celów audytu i zgodności z RODO.'
                                    },
                                    {
                                        name: 'accessToken',
                                        domain: mainDomain,
                                        expiration: '2 miesiące',
                                        desc: 'Token uwierzytelniający sesję zalogowanego użytkownika. Niezbędny do utrzymania stanu logowania.'
                                    },
                                    {
                                        name: 'refreshToken',
                                        domain: mainDomain,
                                        expiration: '2 miesiące',
                                        desc: 'Token odświeżający służący do automatycznego przedłużania sesji użytkownika bez konieczności ponownego logowania.'
                                    }
                                ]
                            }
                        }, {
                            title: 'Statystyczne',
                            description: 'Ta grupa plików cookie gromadzi informacje o sposobie korzystania z witryny, odwiedzonych stronach i klikniętych linkach. Żadna z tych informacji nie może być wykorzystana do identyfikacji użytkownika. Wszystkie te informacje są zagregowane, a zatem zanonimizowane. Ich jedynym celem jest poprawa funkcjonowania witryny.',
                            linkedCategory: 'analytics',
                            cookieTable: {
                                caption: 'Statystyczne pliki cookie',
                                headers: {
                                    name: 'Nazwa',
                                    cookies: 'Cookies',
                                    domain: 'Domena',
                                    expiration: 'Wygaśnięcie',
                                    desc: 'Opis'
                                },
                                body: [
                                    {
                                        name: 'Google Analytics',
                                        cookies: '_ga*, _gid, _gat, utm_*',
                                        domain: mainDomain,
                                        expiration: '24h - 2 lata',
                                        desc: 'Rejestruje unikalne ID użytkownika do generowania danych statystycznych o sposobie korzystania ze strony. Śledzi liczbę odwiedzin, czas spędzony na stronie, źródła ruchu i interakcje z elementami witryny.'
                                    },
                                    {
                                        name: 'Google Analytics',
                                        cookies: '_ga, _gid, __utma, __utmb, __utmc, __utmz',
                                        domain: '.google-analytics.com',
                                        expiration: '24h - 2 lata',
                                        desc: 'Cookies ustawiane przez serwery Google Analytics do śledzenia i analizy ruchu na stronie.'
                                    },
                                    {
                                        name: 'Google Tag Manager',
                                        cookies: '_gtmeec*, _gcl_*',
                                        domain: '.googletagmanager.com',
                                        expiration: 'Sesja - 3 miesiące',
                                        desc: 'Cookies używane przez Google Tag Manager do zarządzania tagami i śledzenia zdarzeń na stronie.'
                                    },
                                    {
                                        name: 'Microsoft Clarity',
                                        cookies: '_clck, _clsk',
                                        domain: mainDomain,
                                        expiration: '1 dzień - 1 rok',
                                        desc: 'Zbiera dane o zachowaniu użytkowników na stronie, tworzy mapy cieplne kliknięć i przewijania oraz nagrywa anonimowe sesje użytkowników w celu analizy użyteczności witryny.'
                                    },
                                    {
                                        name: 'Microsoft Clarity',
                                        cookies: 'MUID, ANONCHK, MR, SM',
                                        domain: '.clarity.ms',
                                        expiration: 'Sesja - 1 rok',
                                        desc: 'Identyfikuje unikalne przeglądarki odwiedzające strony Microsoft. Służy do celów reklamowych, analitycznych i operacyjnych.'
                                    },
                                    {
                                        name: 'User.com',
                                        cookies: '_ueuuid',
                                        domain: '.user.com',
                                        expiration: '1 rok',
                                        desc: 'Przechowuje unikalny identyfikator użytkownika umożliwiający rozpoznanie powracających odwiedzających i personalizację treści oraz komunikacji marketingowej.'
                                    }
                                ]
                            }
                        }, {
                            title: 'Preferencje',
                            description: 'Te pliki cookies pomagają nam poprawić jakość interfejsu oraz ogólne doświadczenia użytkownika związane ze stroną.',
                            linkedCategory: 'personalization',
                            cookieTable: {
                                caption: 'Pliki cookie preferencji',
                                headers: {
                                    name: 'Nazwa',
                                    cookies: 'Cookies',
                                    domain: 'Domena',
                                    expiration: 'Wygaśnięcie',
                                    desc: 'Opis'
                                },
                                body: [
                                    {
                                        name: 'Google Ads',
                                        cookies: 'FPAU',
                                        domain: mainDomain,
                                        expiration: '3 miesiące',
                                        desc: 'Przechowuje informacje o pierwszej wizycie użytkownika i śledzi jego aktywność w celu optymalizacji kampanii reklamowych Google.'
                                    },
                                    {
                                        name: 'Client support',
                                        cookies: '__ca__chat',
                                        domain: mainDomain,
                                        expiration: '1 rok',
                                        desc: 'Przechowuje identyfikator sesji czatu i historię konwersacji, umożliwiając kontynuowanie rozmowy z obsługą klienta po powrocie na stronę.'
                                    }
                                ]
                            }
                        }, {
                            title: 'Marketing',
                            description: 'Te pliki cookie śledzą aktywność użytkownika, aby pomóc nam w dostarczaniu bardziej odpowiednich komunikatów reklamowych. Mogą one być wykorzystywane przez podmioty trzecie do tworzenia profilu zainteresowań użytkownika na podstawie informacji o przeglądaniu stron internetowych poprzez identyfikację przeglądarki i urządzenia końcowego użytkownika.',
                            linkedCategory: 'marketing',
                            cookieTable: {
                                caption: 'Marketingowe pliki cookie',
                                headers: {
                                    name: 'Nazwa',
                                    cookies: 'Cookies',
                                    domain: 'Domena',
                                    expiration: 'Wygaśnięcie',
                                    desc: 'Opis'
                                },
                                body: [
                                    {
                                        name: 'Google Ads',
                                        cookies: '_gcl_au, _gcl_aw, _gcl_dc',
                                        domain: mainDomain,
                                        expiration: '3 miesiące',
                                        desc: 'Używane przez Google Ads do eksperymentowania z efektywnością reklam. Pomaga reklamodawcom określić, ile razy użytkownicy klikający w reklamy wykonują działania na stronie.'
                                    },
                                    {
                                        name: 'Google DoubleClick',
                                        cookies: 'IDE, test_cookie, ar_debug',
                                        domain: '.doubleclick.net',
                                        expiration: 'Sesja - 1 rok',
                                        desc: 'Służy do targetowania, analizy i optymalizacji kampanii reklamowych w DoubleClick/Google Marketing Platform. Sprawdza również czy przeglądarka obsługuje pliki cookie.'
                                    },
                                    {
                                        name: 'Google Ads',
                                        cookies: 'NID, 1P_JAR, __Secure-*, ANID, CONSENT',
                                        domain: '.google.com',
                                        expiration: '6 miesięcy - 2 lata',
                                        desc: 'Zbiera statystyki strony i śledzi współczynniki konwersji. Personalizuje reklamy Google na podstawie ostatnich wyszukiwań i interakcji użytkownika.'
                                    },
                                    {
                                        name: 'Google Ads',
                                        cookies: 'AID, DSID, TAID, IDE',
                                        domain: '.google.pl',
                                        expiration: '1 - 2 lata',
                                        desc: 'Cookies Google Ads dla polskiej domeny Google. Służą do personalizacji reklam i śledzenia konwersji.'
                                    },
                                    {
                                        name: 'Google Ads',
                                        cookies: '__gads, __gpi, __gpi_optout',
                                        domain: '.googlesyndication.com',
                                        expiration: '1 - 2 lata',
                                        desc: 'Cookies używane przez Google AdSense do wyświetlania spersonalizowanych reklam i mierzenia ich skuteczności.'
                                    },
                                    {
                                        name: 'Google Ads',
                                        cookies: 'ar_debug, _ar_v4',
                                        domain: '.googleadservices.com',
                                        expiration: 'Sesja - 1 rok',
                                        desc: 'Cookies używane do śledzenia konwersji Google Ads i remarketingu.'
                                    },
                                    {
                                        name: 'Meta Pixel',
                                        cookies: '_fbp, _fbc',
                                        domain: mainDomain,
                                        expiration: '3 miesiące',
                                        desc: 'Identyfikuje przeglądarki w celu śledzenia konwersji z reklam Facebook / Instagram / Meta Platform, optymalizacji kampanii i budowania grup odbiorców do remarketingu.'
                                    },
                                    {
                                        name: 'Meta Pixel',
                                        cookies: 'fr, tr, c_user, xs, datr',
                                        domain: '.facebook.com',
                                        expiration: '3 miesiące - 2 lata',
                                        desc: 'Cookies ustawiane przez Facebook do śledzenia użytkowników, personalizacji reklam i remarketingu.'
                                    },
                                    {
                                        name: 'TikTok Pixel',
                                        cookies: '_ttp, _tt_enable_cookie',
                                        domain: mainDomain,
                                        expiration: '13 miesięcy',
                                        desc: 'Identyfikuje odwiedzających stronę w celu śledzenia konwersji z reklam TikTok, mierzenia skuteczności kampanii i tworzenia list remarketingowych.'
                                    },
                                    {
                                        name: 'TikTok Pixel',
                                        cookies: 'tt_webid, tt_webid_v2, ttwid',
                                        domain: '.tiktok.com',
                                        expiration: '13 miesięcy',
                                        desc: 'Cookies ustawiane przez TikTok do identyfikacji użytkowników i śledzenia konwersji.'
                                    },
                                    {
                                        name: 'Microsoft Advertising',
                                        cookies: '_uetsid, _uetvid',
                                        domain: mainDomain,
                                        expiration: '1 dzień - 13 miesięcy',
                                        desc: 'Śledzi działania użytkowników po kliknięciu reklamy Bing / Microsoft Ads. Przechowuje identyfikator sesji i odwiedzającego do mierzenia konwersji i remarketingu.'
                                    },
                                    {
                                        name: 'Microsoft Advertising',
                                        cookies: 'MUID, MR, SRM_B',
                                        domain: '.bing.com',
                                        expiration: '1 rok',
                                        desc: 'Identyfikuje unikalne przeglądarki odwiedzające strony z wykorzystaniem Bing / Microsoft Ads. Używane do reklam, analityki i synchronizacji identyfikatorów między usługami.'
                                    },
                                    {
                                        name: 'Microsoft Advertising',
                                        cookies: 'MUID',
                                        domain: '.ads.microsoft.com',
                                        expiration: '1 rok',
                                        desc: 'Unikalny identyfikator użytkownika Bing / Microsoft Ads używany do targetowania reklam, analizy i personalizacji treści reklamowych.'
                                    },
                                    {
                                        name: 'YouTube',
                                        cookies: 'VISITOR_INFO1_LIVE, YSC, VISITOR_PRIVACY_METADATA',
                                        domain: '.youtube.com',
                                        expiration: 'Sesja - 6 miesięcy',
                                        desc: 'Rejestruje anonimowe dane statystyczne o osadzonych filmach YouTube – ile razy film został wyświetlony i jakie ustawienia odtwarzania zostały użyte.'
                                    }
                                ]
                            }
                        }, {
                            title: 'Potrzebujesz więcej informacji?',
                            description: `W przypadku jakichkolwiek pytań dotyczących naszej polityki w zakresie plików cookie i możliwości wyboru użytkownika <a class="cc__link" href="${contactUrl}">skontaktuj się</a> z nami.`,
                        }
                    ]
                }
            }
        }
    }
    
});