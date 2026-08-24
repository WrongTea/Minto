function createVideoViewTracker(video, onWatched) {
    var watchedSeconds = 0;
    var lastTime = null;
    var isPlaying = false;
    var viewAttempted = false;

    function rememberPosition() {
        lastTime = video.currentTime;
    }

    function reset() {
        watchedSeconds = 0;
        viewAttempted = false;
        rememberPosition();
    }

    video.addEventListener("loadedmetadata", rememberPosition);

    video.addEventListener("play", function () {
        isPlaying = true;
        rememberPosition();
    });

    video.addEventListener("pause", function () {
        isPlaying = false;
        rememberPosition();
    });

    video.addEventListener("ended", function () {
        isPlaying = false;
        rememberPosition();
    });

    video.addEventListener("seeking", rememberPosition);
    video.addEventListener("seeked", rememberPosition);

    video.addEventListener("timeupdate", function () {
        var currentTime = video.currentTime;
        var duration = video.duration;

        if (isPlaying && !video.seeking && lastTime !== null) {
            var watchedSinceLastUpdate = currentTime - lastTime;

            // A large jump is a seek, not watched video.
            if (watchedSinceLastUpdate > 0 && watchedSinceLastUpdate <= 1.5) {
                watchedSeconds += watchedSinceLastUpdate;
            }
        }

        lastTime = currentTime;

        if (
            !viewAttempted &&
            isFinite(duration) &&
            duration > 0 &&
            watchedSeconds >= duration * 0.8
        ) {
            viewAttempted = true;
            onWatched();
        }
    });

    return {
        reset: reset
    };
}


function showCopyLinkNotification(message, isError) {
    var notification = document.getElementById("copy-link-notification");
    var messageElement = document.getElementById("copy-link-message");
    var titleElement = document.getElementById("copy-link-title");
    var iconElement = document.getElementById("copy-link-icon");

    if (!notification) {
        return;
    }

    if (messageElement && message) {
        messageElement.textContent = message;
    }

    if (titleElement) {
        titleElement.textContent = isError ? "Copy failed" : "Link copied";
    }

    if (iconElement) {
        iconElement.textContent = isError ? "!" : "✓";
    }

    if (window.copyLinkToastTimer) {
        clearTimeout(window.copyLinkToastTimer);
    }

    notification.classList.add("show");

    window.copyLinkToastTimer = setTimeout(function () {
        notification.classList.remove("show");
    }, 2500);
}


function copyTextWithNotification(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
            .then(function () {
                showCopyLinkNotification(successMessage);
            })
            ["catch"](function (error) {
                console.error("Copy link error:", error);
                showCopyLinkNotification("Could not copy the link.", true);
            });
    }

    var textArea = document.createElement("textarea");

    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        if (document.execCommand("copy")) {
            showCopyLinkNotification(successMessage);
        } else {
            showCopyLinkNotification("Could not copy the link.", true);
        }
    } catch (error) {
        console.error("Copy link error:", error);
        showCopyLinkNotification("Could not copy the link.", true);
    }

    document.body.removeChild(textArea);
}
