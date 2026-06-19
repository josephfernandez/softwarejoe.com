// Lightweight, analytics-ready tracking hooks. No third-party scripts yet —
// drop in GA4 / Plausible later and the events below are ready to fire.
(function () {
    var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];

    // 1. Capture UTM / ref params on landing and persist them for the session,
    //    so the original source survives navigation to the booking tool / form.
    var params = new URLSearchParams(window.location.search);
    KEYS.forEach(function (k) {
        var v = params.get(k);
        if (v) { try { sessionStorage.setItem('sj_' + k, v); } catch (e) {} }
    });

    function stored() {
        var out = {};
        KEYS.forEach(function (k) {
            var v = null;
            try { v = sessionStorage.getItem('sj_' + k); } catch (e) {}
            if (v) out[k] = v;
        });
        return out;
    }

    var attribution = stored();

    // 2. Carry attribution through to the scheduling link(s).
    document.querySelectorAll('[data-cta="book"]').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (href.indexOf('REPLACE') !== -1 || href.charAt(0) === '#') return; // skip placeholder / anchor
        try {
            var url = new URL(href, window.location.origin);
            Object.keys(attribution).forEach(function (k) { url.searchParams.set(k, attribution[k]); });
            a.setAttribute('href', url.toString());
        } catch (e) {}
    });

    // 3. Attach attribution to the contact form as hidden fields.
    var form = document.querySelector('.contact-form');
    if (form) {
        Object.keys(attribution).forEach(function (k) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = attribution[k];
            form.appendChild(input);
        });
    }

    // 4. Conversion event hooks. Wire these to your analytics when you add it.
    function track(name) {
        if (window.gtag) window.gtag('event', 'cta_click', { cta_name: name });
        if (window.plausible) window.plausible('CTA: ' + name);
    }

    document.querySelectorAll('[data-cta]').forEach(function (el) {
        el.addEventListener('click', function () { track(el.getAttribute('data-cta')); });
    });

    if (form) {
        form.addEventListener('submit', function () { track('contact_form_submit'); });
    }
})();
