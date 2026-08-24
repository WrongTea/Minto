(function () {
    var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
    var testDirectory = fileSystem.GetParentFolderName(WScript.ScriptFullName);
    var projectDirectory = fileSystem.GetParentFolderName(
        fileSystem.GetParentFolderName(testDirectory)
    );
    var commonPath = fileSystem.BuildPath(
        projectDirectory,
        "static\\js\\common.js"
    );
    var commonFile = fileSystem.OpenTextFile(commonPath, 1);

    eval(commonFile.ReadAll());
    commonFile.Close();

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(
                message + ": expected " + expected + ", got " + actual
            );
        }
    }

    function FakeVideo(duration) {
        this.currentTime = 0;
        this.duration = duration;
        this.seeking = false;
        this.listeners = {};
    }

    FakeVideo.prototype.addEventListener = function (eventName, listener) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }

        this.listeners[eventName].push(listener);
    };

    FakeVideo.prototype.emit = function (eventName) {
        var listeners = this.listeners[eventName] || [];

        for (var index = 0; index < listeners.length; index += 1) {
            listeners[index]();
        }
    };

    function playTo(video, targetTime) {
        video.emit("play");

        while (video.currentTime < targetTime) {
            video.currentTime += 1;
            video.emit("timeupdate");
        }
    }

    function testViewWaitsForEightyPercent() {
        var video = new FakeVideo(10);
        var requests = 0;

        createVideoViewTracker(video, function () {
            requests += 1;
        });

        playTo(video, 7);
        assertEqual(requests, 0, "view before 80 percent");

        video.currentTime = 8;
        video.emit("timeupdate");
        assertEqual(requests, 1, "view at 80 percent");
    }

    function testViewRequestIsSentOnlyOnce() {
        var video = new FakeVideo(10);
        var requests = 0;

        createVideoViewTracker(video, function () {
            requests += 1;
        });

        playTo(video, 10);
        video.currentTime = 0;
        video.emit("seeking");
        playTo(video, 10);

        assertEqual(requests, 1, "duplicate view request");
    }

    function testSeekingDoesNotCountAsWatching() {
        var video = new FakeVideo(10);
        var requests = 0;

        createVideoViewTracker(video, function () {
            requests += 1;
        });

        playTo(video, 2);

        video.seeking = true;
        video.emit("seeking");

        while (video.currentTime < 8) {
            video.currentTime += 0.5;
            video.emit("timeupdate");
        }

        video.seeking = false;
        video.emit("seeked");

        assertEqual(requests, 0, "seek counted as watched time");
    }

    function testResetStartsANewOpening() {
        var video = new FakeVideo(10);
        var requests = 0;
        var tracker = createVideoViewTracker(video, function () {
            requests += 1;
        });

        playTo(video, 8);

        video.currentTime = 0;
        video.emit("seeking");
        video.emit("seeked");
        tracker.reset();
        playTo(video, 8);

        assertEqual(requests, 2, "new opening was not tracked");
    }

    function testCopyShowsAndHidesSharedNotification() {
        var copiedText = "";
        var pendingTimer = null;
        var notification = {
            shown: false,
            classList: {
                add: function () {
                    notification.shown = true;
                },
                remove: function () {
                    notification.shown = false;
                }
            }
        };
        var messageElement = {textContent: ""};
        var titleElement = {textContent: "Link copied"};
        var iconElement = {textContent: "✓"};

        window = {isSecureContext: true, copyLinkToastTimer: null};
        navigator = {
            clipboard: {
                writeText: function (text) {
                    copiedText = text;

                    return {
                        then: function (callback) {
                            callback();

                            return {
                                "catch": function () {}
                            };
                        }
                    };
                }
            }
        };
        document = {
            getElementById: function (id) {
                if (id === "copy-link-notification") {
                    return notification;
                }

                if (id === "copy-link-message") {
                    return messageElement;
                }

                if (id === "copy-link-title") {
                    return titleElement;
                }

                if (id === "copy-link-icon") {
                    return iconElement;
                }

                return null;
            }
        };
        setTimeout = function (callback) {
            pendingTimer = callback;
            return 1;
        };
        clearTimeout = function () {};

        copyTextWithNotification("https://example.test/video/1/", "Copied");

        assertEqual(copiedText, "https://example.test/video/1/", "copied URL");
        assertEqual(messageElement.textContent, "Copied", "toast message");
        assertEqual(titleElement.textContent, "Link copied", "toast title");
        assertEqual(iconElement.textContent, "✓", "toast icon");
        assertEqual(notification.shown, true, "toast visibility");

        pendingTimer();
        assertEqual(notification.shown, false, "toast auto hide");

        showCopyLinkNotification("Could not copy the link.", true);
        assertEqual(titleElement.textContent, "Copy failed", "error title");
        assertEqual(iconElement.textContent, "!", "error icon");
    }

    testViewWaitsForEightyPercent();
    testViewRequestIsSentOnlyOnce();
    testSeekingDoesNotCountAsWatching();
    testResetStartsANewOpening();
    testCopyShowsAndHidesSharedNotification();

    WScript.Echo("video_behaviour.js: PASS");
}());
