// Visitor counter using Firebase Realtime Database
(function () {
    var COUNTER_EL = document.getElementById('visitor-count');
    var counterRef = db.ref('counters/visitors');

    // Listen for real-time updates
    counterRef.on('value', function (snapshot) {
        var count = snapshot.val() || 0;
        COUNTER_EL.textContent = count.toLocaleString();
    });

    // Increment if new session
    var alreadyCounted = false;
    try { alreadyCounted = sessionStorage.getItem('sj_counted'); } catch (e) {}

    if (!alreadyCounted) {
        counterRef.once('value').then(function (snapshot) {
            var current = snapshot.val() || 0;
            counterRef.set(current + 1);
        });
        try { sessionStorage.setItem('sj_counted', '1'); } catch (e) {}
    }
})();
