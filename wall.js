// Wall using Firebase Realtime Database
(function () {
    var submitBtn = document.getElementById('wall-submit');
    var nameInput = document.getElementById('wall-name');
    var messageInput = document.getElementById('wall-message');
    var messagesContainer = document.getElementById('wall-messages');
    var wallRef = db.ref('wall');

    // Post a message
    submitBtn.addEventListener('click', function () {
        var message = messageInput.value.trim();
        if (!message) return;

        wallRef.push({
            name: nameInput.value.trim() || 'Anon',
            message: message,
            timestamp: Date.now()
        }).then(function () {
            messageInput.value = '';
            nameInput.value = '';
        });
    });

    // Enter to submit
    messageInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitBtn.click();
        }
    });

    // Listen for messages (latest 50, real-time)
    wallRef.orderByChild('timestamp').limitToLast(50).on('value', function (snapshot) {
        messagesContainer.innerHTML = '';

        if (!snapshot.exists()) {
            messagesContainer.innerHTML = '<div class="wall-empty">No posts yet. Be the first.</div>';
            return;
        }

        var posts = [];
        snapshot.forEach(function (child) {
            posts.push(child.val());
        });

        posts.reverse().forEach(function (post) {
            var el = document.createElement('div');
            el.className = 'wall-post';
            el.innerHTML =
                '<div class="wall-post-header">' +
                    '<span class="wall-post-name">' + escapeHtml(post.name) + '</span>' +
                    '<span class="wall-post-time">' + getTimeAgo(post.timestamp) + '</span>' +
                '</div>' +
                '<div class="wall-post-body">' + escapeHtml(post.message) + '</div>';
            messagesContainer.appendChild(el);
        });
    });

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getTimeAgo(timestamp) {
        var seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
        return new Date(timestamp).toLocaleDateString();
    }
})();
