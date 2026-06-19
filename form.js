// Progressive enhancement for the contact form: submit via fetch to /api/contact,
// then redirect to the thank-you page. Falls back to a normal POST if JS is off.
(function () {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var btn = form.querySelector('button[type="submit"]');
    var status = document.getElementById('form-status');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        var data = {};
        new FormData(form).forEach(function (value, key) { data[key] = value; });

        var label = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending…';
        if (status) { status.textContent = ''; status.className = 'form-status'; }

        fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(function (r) {
            if (!r.ok) throw new Error('request failed');
            window.location.href = '/thanks.html';
        }).catch(function () {
            btn.disabled = false;
            btn.textContent = label;
            if (status) {
                status.textContent = 'Something went wrong — please email joe@softwarejoe.com directly.';
                status.className = 'form-status error';
            }
        });
    });
})();
