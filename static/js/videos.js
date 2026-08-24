let isDraggingProgress = false;
let activeCommentsVideoId = null;


/* =========================
   URL
   ========================= */

function getFeedUrl() {
    let url = window.location.pathname;

    if (!url.endsWith("/")) {
        url += "/";
    }

    return url;
}


/* =========================
   VIDEO
   ========================= */

function getVideo(videoId) {
    return document.getElementById("video-" + videoId);
}


function updateCenterIndicator(videoId) {
    const video = getVideo(videoId);
    const container = document.getElementById("center-play-" + videoId);
    const icon = document.getElementById("center-icon-" + videoId);

    if (!video || !container || !icon) {
        return;
    }

    if (video.paused) {
        icon.innerHTML = "▶";

        container.classList.remove("opacity-0");
        container.classList.add("opacity-100");
    } else {
        icon.innerHTML = "❚❚";

        container.classList.remove("opacity-100");
        container.classList.add("opacity-0");
    }
}


function toggleVideo(videoId) {
    const video = getVideo(videoId);

    if (!video) {
        return;
    }

    if (video.paused) {
        video.play().catch(function () {});
    } else {
        video.pause();
    }
}

function toggleMute(event, videoId) {
    event.preventDefault();
    event.stopPropagation();

    const video = getVideo(videoId);
    const button = document.getElementById(
        "mute-button-" + videoId
    );

    if (!video || !button) {
        return;
    }

    video.muted = !video.muted;

    if (video.muted) {
        button.textContent = "🔇";
        button.setAttribute("aria-label", "Unmute video");
    } else {
        button.textContent = "🔊";
        button.setAttribute("aria-label", "Mute video");
    }
}

function toggleFullscreen(videoId) {
    const video = getVideo(videoId);

    if (!video) {
        return;
    }

    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
    }
}


/* =========================
   PROGRESS BAR
   ========================= */

function getProgressPercent(event, hitbox) {
    const rect = hitbox.getBoundingClientRect();

    let clientX;

    if (event.touches && event.touches.length) {
        clientX = event.touches[0].clientX;
    } else {
        clientX = event.clientX;
    }

    let percent =
        ((clientX - rect.left) / rect.width) * 100;

    return Math.max(0, Math.min(100, percent));
}


function setVideoPosition(event, videoId) {
    const hitbox =
        document.getElementById(
            "progress-hitbox-" + videoId
        );

    const video = getVideo(videoId);

    if (
        !hitbox ||
        !video ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
    ) {
        return;
    }

    const percent =
        getProgressPercent(event, hitbox);

    video.currentTime =
        (percent / 100) * video.duration;
}


function startSeek(event, videoId) {
    isDraggingProgress = true;

    const hitbox =
        document.getElementById(
            "progress-hitbox-" + videoId
        );

    if (
        hitbox &&
        event.pointerId !== undefined
    ) {
        try {
            hitbox.setPointerCapture(
                event.pointerId
            );
        } catch (e) {}
    }

    setVideoPosition(event, videoId);

    event.preventDefault();
    event.stopPropagation();
}


function dragSeek(event, videoId) {
    if (!isDraggingProgress) {
        return;
    }

    setVideoPosition(event, videoId);

    event.preventDefault();
    event.stopPropagation();
}


function stopSeek(event) {
    isDraggingProgress = false;

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
}


function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);

    return (
        minutes +
        ":" +
        String(secs).padStart(2, "0")
    );
}


/* =========================
   CSRF
   ========================= */

function getCookie(name) {
    const cookies =
        document.cookie
            ? document.cookie.split(";")
            : [];

    for (let cookie of cookies) {
        cookie = cookie.trim();

        if (cookie.startsWith(name + "=")) {
            return decodeURIComponent(
                cookie.substring(
                    name.length + 1
                )
            );
        }
    }

    return null;
}


/* =========================
   LIKES
   ========================= */

function likeVideo(event, videoId) {
    event.preventDefault();
    event.stopPropagation();

    const button =
        document.getElementById(
            "like-button-" + videoId
        );

    const icon =
        document.getElementById(
            "like-icon-" + videoId
        );

    const count =
        document.getElementById(
            "like-count-" + videoId
        );

    if (!button || !icon || !count) {
        return;
    }

    button.disabled = true;

    fetch(
        getFeedUrl() +
        "video/" +
        videoId +
        "/like/",
        {
            method: "POST",

            headers: {
                "X-CSRFToken":
                    getCookie("csrftoken"),

                "X-Requested-With":
                    "XMLHttpRequest"
            }
        }
    )
    .then(function(response) {

        if (!response.ok) {
            throw new Error(
                "Like request failed"
            );
        }

        return response.json();
    })
    .then(function(data) {

        count.textContent =
            data.likes_count;

        if (data.liked) {

            icon.textContent = "❤️";

            button.classList.remove(
                "bg-[#202024]"
            );

            button.classList.add(
                "bg-red-500/20"
            );

        } else {

            icon.textContent = "🤍";

            button.classList.remove(
                "bg-red-500/20"
            );

            button.classList.add(
                "bg-[#202024]"
            );
        }

    })
    .catch(function(error) {

        console.error(error);

        alert(
            "Could not change like."
        );

    })
    .finally(function() {

        button.disabled = false;

    });
}


/* =========================
   COMMENTS
   ========================= */

function openComments(event, videoId) {
    event.preventDefault();
    event.stopPropagation();

    activeCommentsVideoId = videoId;

    const modal =
        document.getElementById(
            "comments-modal"
        );

    const sheet =
        document.getElementById(
            "comments-sheet"
        );

    const backdrop =
        document.getElementById(
            "comments-backdrop"
        );

    const list =
        document.getElementById(
            "comments-list"
        );

    const input =
        document.getElementById(
            "comment-input"
        );

    if (
        !modal ||
        !sheet ||
        !backdrop ||
        !list
    ) {
        return;
    }

    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    list.innerHTML = `
        <div class="text-center text-gray-500 py-10">
            Loading comments...
        </div>
    `;

    requestAnimationFrame(function() {

        backdrop.classList.remove(
            "opacity-0"
        );

        backdrop.classList.add(
            "opacity-100"
        );

        sheet.classList.add("open");

    });

    loadComments(videoId);

    setTimeout(function() {

        if (input) {
            input.focus();
        }

    }, 300);
}


function closeComments() {
    const modal =
        document.getElementById(
            "comments-modal"
        );

    const sheet =
        document.getElementById(
            "comments-sheet"
        );

    const backdrop =
        document.getElementById(
            "comments-backdrop"
        );

    if (
        !modal ||
        !sheet ||
        !backdrop
    ) {
        return;
    }

    sheet.classList.remove("open");

    backdrop.classList.remove(
        "opacity-100"
    );

    backdrop.classList.add(
        "opacity-0"
    );

    setTimeout(function() {

        modal.classList.add("hidden");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        activeCommentsVideoId = null;

    }, 250);
}


function loadComments(videoId) {
    const list =
        document.getElementById(
            "comments-list"
        );

    if (!list) {
        return;
    }

    fetch(
        getFeedUrl() +
        "video/" +
        videoId +
        "/comments/"
    )
    .then(function(response) {

        if (!response.ok) {
            throw new Error(
                "Comments request failed"
            );
        }

        return response.json();

    })
    .then(function(data) {

        renderComments(
            data.comments || []
        );

    })
    .catch(function(error) {

        console.error(error);

        list.innerHTML = `
            <div class="text-center text-red-400 py-10">
                Could not load comments.
            </div>
        `;

    });
}


function renderComments(comments) {
    const list =
        document.getElementById(
            "comments-list"
        );

    const titleCount =
        document.getElementById(
            "comments-title-count"
        );

    if (!list) {
        return;
    }

    if (titleCount) {

        titleCount.textContent =
            comments.length +
            (
                comments.length === 1
                    ? " comment"
                    : " comments"
            );

    }

    if (!comments.length) {

        list.innerHTML = `
            <div class="text-center text-gray-500 py-12">

                <div class="text-4xl mb-3">
                    💬
                </div>

                <p>No comments yet.</p>

                <p class="text-sm mt-1">
                    Be the first to comment!
                </p>

            </div>
        `;

        return;
    }

    list.innerHTML =
        comments.map(function(comment) {

            const avatar =
                comment.avatar

                    ? `
                        <img
                            src="${escapeHtml(comment.avatar)}"
                            class="comment-avatar rounded-full object-cover"
                            alt=""
                        >
                    `

                    : `
                        <div
                            class="comment-avatar rounded-full bg-indigo-600
                                   flex items-center justify-center font-bold"
                        >
                            ${escapeHtml(
                                (
                                    comment.username ||
                                    "?"
                                )
                                .charAt(0)
                                .toUpperCase()
                            )}
                        </div>
                    `;

            return `
                <div class="flex gap-3">

                    ${avatar}

                    <div class="min-w-0 flex-1">

                        <div class="flex items-center gap-2">

                            <span class="font-semibold text-sm">
                                @${escapeHtml(
                                    comment.username
                                )}
                            </span>

                            <span class="text-[11px] text-gray-500">
                                ${escapeHtml(
                                    comment.created_at
                                )}
                            </span>

                        </div>

                        <p class="text-sm text-gray-200 mt-1 break-words">
                            ${escapeHtml(
                                comment.text
                            )}
                        </p>

                    </div>

                </div>
            `;

        })
        .join("");
}


function submitComment(event) {
    event.preventDefault();

    if (!activeCommentsVideoId) {
        return;
    }

    const input =
        document.getElementById(
            "comment-input"
        );

    const submitButton =
        document.getElementById(
            "comment-submit"
        );

    if (!input || !submitButton) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    submitButton.disabled = true;

    const formData =
        new FormData();

    formData.append(
        "text",
        text
    );

    fetch(
        getFeedUrl() +
        "video/" +
        activeCommentsVideoId +
        "/comments/add/",
        {
            method: "POST",

            headers: {
                "X-CSRFToken":
                    getCookie("csrftoken"),

                "X-Requested-With":
                    "XMLHttpRequest"
            },

            body: formData
        }
    )
    .then(function(response) {

        return response.json()
            .then(function(data) {

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Could not add comment."
                    );

                }

                return data;

            });

    })
    .then(function(data) {

        input.value = "";

        const count =
            document.getElementById(
                "comment-count-" +
                activeCommentsVideoId
            );

        if (count) {

            count.textContent =
                data.comments_count;

        }

        loadComments(
            activeCommentsVideoId
        );

    })
    .catch(function(error) {

        console.error(error);

        alert(
            error.message ||
            "Could not add comment."
        );

    })
    .finally(function() {

        submitButton.disabled = false;

        input.focus();

    });
}


function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   SHARE
   ========================= */

function showCopyLinkNotification(message) {

    const notification =
        document.getElementById(
            "copy-link-notification"
        );

    const messageElement =
        document.getElementById(
            "copy-link-message"
        );

    if (!notification) {
        return;
    }

    if (messageElement && message) {
        messageElement.textContent = message;
    }

    // Если уведомление уже открыто,
    // сначала сбрасываем таймер
    if (window.copyLinkToastTimer) {
        clearTimeout(
            window.copyLinkToastTimer
        );
    }

    notification.classList.add("show");

    window.copyLinkToastTimer =
        setTimeout(function () {

            notification.classList.remove(
                "show"
            );

        }, 2500);
}


function copyVideoLink(event, videoId) {

    event.preventDefault();
    event.stopPropagation();

    const url =
        window.location.origin +
        getFeedUrl() +
        "#video-" +
        videoId;


    // Современный способ копирования
    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        navigator.clipboard
            .writeText(url)

            .then(function () {

                showCopyLinkNotification(
                    "Video link copied successfully."
                );

            })

            .catch(function (error) {

                console.error(
                    "Copy link error:",
                    error
                );

                showCopyLinkNotification(
                    "Could not copy the link."
                );

            });

        return;
    }


    // Запасной способ для HTTP / старых браузеров
    const textArea =
        document.createElement("textarea");

    textArea.value = url;

    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";

    document.body.appendChild(
        textArea
    );

    textArea.focus();
    textArea.select();

    try {

        const successful =
            document.execCommand("copy");

        if (successful) {

            showCopyLinkNotification(
                "Video link copied successfully."
            );

        } else {

            showCopyLinkNotification(
                "Could not copy the link."
            );

        }

    } catch (error) {

        console.error(
            "Copy link error:",
            error
        );

        showCopyLinkNotification(
            "Could not copy the link."
        );

    }

    document.body.removeChild(
        textArea
    );
}


/* =========================
   VIDEO EVENTS
   ========================= */

document
    .querySelectorAll("video")
    .forEach(function(video) {

        const videoId =
            video.id.replace(
                "video-",
                ""
            );

        const progress =
            document.getElementById(
                "progress-" + videoId
            );

        const currentTime =
            document.getElementById(
                "current-time-" + videoId
            );


        video.addEventListener(
            "loadedmetadata",
            function() {

                if (currentTime) {

                    currentTime.textContent =
                        "0:00 / " +
                        formatTime(
                            video.duration
                        );

                }

                updateCenterIndicator(
                    videoId
                );

            }
        );


        video.addEventListener(
            "play",
            function() {

                updateCenterIndicator(
                    videoId
                );

            }
        );


        video.addEventListener(
            "pause",
            function() {

                updateCenterIndicator(
                    videoId
                );

            }
        );


        video.addEventListener(
            "timeupdate",
            function() {

                if (
                    video.duration &&
                    progress &&
                    !isDraggingProgress
                ) {

                    const percent =
                        (
                            video.currentTime /
                            video.duration
                        ) * 100;

                    progress.style.width =
                        percent + "%";

                }


                if (currentTime) {

                    currentTime.textContent =
                        formatTime(
                            video.currentTime
                        ) +
                        " / " +
                        formatTime(
                            video.duration
                        );

                }

            }
        );


        video.addEventListener(
            "ended",
            function() {

                if (progress) {

                    progress.style.width =
                        "100%";

                }

                updateCenterIndicator(
                    videoId
                );

            }
        );

    });


/* =========================
   ESCAPE
   ========================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {
            closeComments();
        }

    }
);

document.addEventListener("DOMContentLoaded", function () {
    const videos = document.querySelectorAll(".video-player");

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                const video = entry.target;

                if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                    // Останавливаем все остальные видео
                    videos.forEach(function (otherVideo) {
                        if (otherVideo !== video) {
                            otherVideo.pause();
                        }
                    });

                    // Запускаем текущее
                    video.play().catch(function () {});
                } else {
                    // Видео вышло из области просмотра
                    video.pause();
                }
            });
        },
        {
            threshold: [0, 0.7, 1]
        }
    );

    videos.forEach(function (video) {
        observer.observe(video);
    });
});