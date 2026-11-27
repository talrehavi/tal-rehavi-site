// Google Analytics 4. Paste the Measurement ID (G-XXXXXXXXXX) below to turn it on.
// Empty ID = nothing loads and nothing is tracked.
(function () {
  var GA_ID = '';
  if (!GA_ID) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  // Count clicks on WhatsApp, phone and email links as leads.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    var kind = /wa\.me|whatsapp/.test(h) ? 'whatsapp' : /^tel:/.test(h) ? 'phone' : /^mailto:/.test(h) ? 'email' : null;
    if (kind) gtag('event', 'generate_lead', { method: kind, link_url: h, page_path: location.pathname });
  });
})();
