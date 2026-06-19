// Vercel serverless function — receives the contact form and emails Joe.
// Uses Resend (https://resend.com) for delivery. Set RESEND_API_KEY in Vercel
// project env vars, and verify the softwarejoe.com domain in Resend so mail
// can be sent from noreply@softwarejoe.com.
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body || {};

    // Honeypot: real users never fill this hidden field; bots do. Pretend success.
    if (body.website) return res.status(200).json({ ok: true });

    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const message = (body.message || '').trim();
    const company = (body.company || '').trim();

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill in your name, email, and message.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ error: 'That email address looks invalid.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not set');
        return res.status(500).json({ error: 'Server is not configured to send mail yet.' });
    }

    // Carry through marketing attribution captured by tracking.js.
    const attribution = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref']
        .filter(function (k) { return body[k]; })
        .map(function (k) { return k + ': ' + body[k]; })
        .join('\n');

    const text =
        'New inquiry from softwarejoe.com\n\n' +
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Company: ' + (company || '—') + '\n\n' +
        'Message:\n' + message + '\n' +
        (attribution ? '\n— Attribution —\n' + attribution + '\n' : '');

    try {
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Software Joe <noreply@softwarejoe.com>',
                to: ['joe@softwarejoe.com'],
                reply_to: email,
                subject: 'New inquiry from ' + name + (company ? ' @ ' + company : ''),
                text: text
            })
        });

        if (!r.ok) {
            console.error('Resend error:', await r.text());
            return res.status(502).json({ error: 'Could not send your message. Please email joe@softwarejoe.com.' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Unexpected error. Please email joe@softwarejoe.com.' });
    }
};
