let profileSeekDragging = false;
let profileVideoUrl = "";
let currentProfilePageUrl = "";
let currentProfileVideoId = null;
let currentProfileLiked = false;
let currentProfileViewUrl = "";
let profileViewTracker = null;


/* ======================================================
   VIEW COUNTER
   ====================================================== */

async function addProfileVideoView() {
    if (!currentProfileVideoId || !currentProfileViewUrl) {
        return;
    }

    const viewedVideoId = currentProfileVideoId;
    const viewUrl = currentProfileViewUrl;

    try {
        const response = await fetch(viewUrl, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCookie("csrftoken"),
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        if (!response.ok || response.redirected) {
            throw new Error("View request failed");
        }

        const data = await response.json();

        if (data.views_count !== undefined) {
            const countElement = document.getElementById(
                "profile-view-count-" + viewedVideoId
            );

            if (countElement) {
                countElement.textContent = data.views_count;
            }

            const modalCount = document.getElementById(
                "profile-player-views"
            );

            if (modalCount && viewedVideoId === currentProfileVideoId) {
                modalCount.textContent =
                    "👁 " + data.views_count + " views";
            }
        }

    } catch (error) {
        console.error("View request error:", error);
    }
}


/* ======================================================
   OPEN VIDEO
   ====================================================== */

function openProfileVideo(btn) {
    if (!btn || !btn.dataset) return;

    const d = btn.dataset;

    const modal = document.getElementById("profile-video-modal");
    const video = document.getElementById("profile-player-video");

    if (!modal || !video) return;

    profileVideoUrl = d.videoUrl;
    currentProfileVideoId = d.videoId;
    currentProfileViewUrl = d.viewUrl;
    currentProfilePageUrl = d.pageUrl;
    currentProfileLiked = (d.liked === "true");

    document.getElementById("profile-player-username").textContent =
        "@" + (d.username || "user");

    document.getElementById("profile-player-description").textContent =
        d.description || "No description";

    document.getElementById("profile-player-date").textContent =
        "🕐 " + (d.uploadDate || "—");

    document.getElementById("profile-like-count").textContent =
        d.likeCount || "0";

    document.getElementById("profile-comment-count").textContent =
        d.commentCount || "0";

    const countElement = document.getElementById(
        "profile-view-count-" + d.videoId
    );

    const modalViewCount = document.getElementById(
        "profile-player-views"
    );

    if (countElement && modalViewCount) {
        modalViewCount.textContent =
            "👁 " + countElement.textContent + " views";
    }

    updateProfileLikeButton();

    const avatarImg = document.getElementById(
        "profile-player-avatar"
    );

    const avatarPlaceholder = document.getElementById(
        "profile-player-avatar-placeholder"
    );

    if (d.avatar) {
        avatarImg.src = d.avatar;
        avatarImg.alt = d.username || "user";

        avatarImg.classList.remove("hidden");
        avatarPlaceholder.classList.add("hidden");

    } else {
        avatarImg.classList.add("hidden");
        avatarPlaceholder.classList.remove("hidden");

        avatarPlaceholder.textContent =
            (d.username || "?").slice(0, 1).toUpperCase();
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    video.src = d.videoUrl;
    video.load();
    video.currentTime = 0;

    if (profileViewTracker) {
        profileViewTracker.reset();
    }

    document.getElementById("profile-progress").style.width = "0%";

    document.getElementById("profile-player-time").textContent =
        "0:00 / 0:00";

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    document.body.classList.add("overflow-hidden");

    const startPlayback = function () {
        video.play()
            .catch(function (error) {
                console.warn("Profile video play error:", error);
            });
    };

    if (video.readyState >= 2) {
        startPlayback();
    } else {
        video.addEventListener(
            "loadeddata",
            startPlayback,
            { once: true }
        );
    }

    updateProfileCenterIndicator();
}


/* ======================================================
   CLOSE VIDEO
   ====================================================== */

function closeProfileVideo() {
    closeProfileComments();

    const modal = document.getElementById(
        "profile-video-modal"
    );

    const video = document.getElementById(
        "profile-player-video"
    );

    if (!modal || !video) return;

    video.pause();

    if (profileViewTracker) {
        profileViewTracker.reset();
    }

    video.removeAttribute("src");
    video.load();

    currentProfileVideoId = null;
    currentProfileViewUrl = "";
    currentProfilePageUrl = "";
    modal.classList.add("hidden");
    modal.classList.remove("flex");

    document.body.classList.remove("overflow-hidden");
}


/* ======================================================
   VIDEO PLAY
   ====================================================== */

function toggleProfilePlayer() {
    const video = document.getElementById(
        "profile-player-video"
    );

    if (!video) return;

    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}


/* ======================================================
   PLAY ICON
   ====================================================== */

function updateProfileCenterIndicator() {
    const video = document.getElementById(
        "profile-player-video"
    );

    const container = document.getElementById(
        "profile-center-play"
    );

    const icon = document.getElementById(
        "profile-center-icon"
    );

    if (!video || !container || !icon) return;

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


/* ======================================================
   LIKE
   ====================================================== */

function updateProfileLikeButton() {
    const button = document.getElementById(
        "profile-like-button"
    );

    if (!button) return;

    if (currentProfileLiked) {
        button.classList.add("bg-red-500/20");
        button.classList.remove("bg-[#202024]");

    } else {
        button.classList.remove("bg-red-500/20");
        button.classList.add("bg-[#202024]");
    }
}


function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();

            if (
                cookie.substring(0, name.length + 1) ===
                (name + "=")
            ) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;
            }
        }
    }

    return cookieValue;
}


async function toggleProfileLike() {
    if (!currentProfileVideoId) return;

    try {
        const response = await fetch(
            `/video/${currentProfileVideoId}/like/`,
            {
                method: "POST",

                headers: {
                    "X-CSRFToken": getCookie("csrftoken"),
                    "X-Requested-With": "XMLHttpRequest"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) return;

        currentProfileLiked = data.liked;

        document.getElementById(
            "profile-like-count"
        ).textContent = data.likes_count;

        updateProfileLikeButton();

    } catch (error) {
        console.error("Like error:", error);
    }
}


/* ======================================================
   COMMENTS
   ====================================================== */

function openProfileComments() {
    if (!currentProfileVideoId) return;

    const overlay = document.getElementById(
        "profile-comments-overlay"
    );

    overlay.classList.remove("comments-closed");
    overlay.classList.add("comments-open");

    loadProfileComments();
}


function closeProfileComments() {
    const overlay = document.getElementById(
        "profile-comments-overlay"
    );

    if (!overlay) return;

    overlay.classList.remove("comments-open");
    overlay.classList.add("comments-closed");
}


async function loadProfileComments() {
    if (!currentProfileVideoId) return;

    const list = document.getElementById(
        "profile-comments-list"
    );

    list.innerHTML =
        `<div class="text-center text-gray-500 py-10">
            Loading comments...
        </div>`;

    try {
        const response = await fetch(
            `/video/${currentProfileVideoId}/comments/`
        );

        const data = await response.json();

        list.innerHTML = "";

        const count = data.comments.length;

        document.getElementById(
            "profile-comments-title-count"
        ).textContent =
            count +
            (count === 1 ? " comment" : " comments");

        document.getElementById(
            "profile-comment-count"
        ).textContent = count;

        if (count === 0) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center text-center text-gray-500 py-20">
                    <div class="text-4xl mb-3">💬</div>
                    <p>No comments yet</p>
                    <p class="text-xs mt-1">
                        Be the first to comment
                    </p>
                </div>`;

            return;
        }

        data.comments.forEach(function (comment) {

            const item = document.createElement("div");

            item.className = "flex gap-3";

            let avatarHTML = comment.avatar
                ? `<img src="${comment.avatar}"
                        class="w-9 h-9 rounded-full object-cover shrink-0">`
                : `<div class="w-9 h-9 rounded-full bg-indigo-600
                            flex items-center justify-center
                            font-bold shrink-0">
                        ${(comment.username || "?")
                            .slice(0, 1)
                            .toUpperCase()}
                   </div>`;

            item.innerHTML = `
                ${avatarHTML}

                <div class="flex-1 min-w-0">

                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-sm">
                            @${escapeHTML(comment.username)}
                        </span>
                    </div>

                    <p class="text-sm text-gray-300 mt-1 break-words">
                        ${escapeHTML(comment.text)}
                    </p>

                    <span class="text-[10px] text-gray-600 block mt-1">
                        ${escapeHTML(comment.created_at)}
                    </span>

                </div>`;

            list.appendChild(item);
        });

        list.scrollTop = list.scrollHeight;

    } catch (error) {
        console.error("Comments error:", error);

        list.innerHTML =
            `<div class="text-center text-red-400 py-10">
                Could not load comments.
            </div>`;
    }
}


async function submitProfileComment(event) {
    event.preventDefault();

    if (!currentProfileVideoId) return;

    const input = document.getElementById(
        "profile-comment-input"
    );

    const text = input.value.trim();

    if (!text) return;

    try {
        const formData = new FormData();

        formData.append("text", text);

        const csrf = document.querySelector(
            "[name=csrfmiddlewaretoken]"
        );

        const response = await fetch(
            `/video/${currentProfileVideoId}/comments/add/`,
            {
                method: "POST",

                headers: {
                    "X-CSRFToken":
                        csrf
                            ? csrf.value
                            : getCookie("csrftoken")
                },

                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Could not add comment."
            );

            return;
        }

        input.value = "";

        await loadProfileComments();

    } catch (error) {
        console.error("Add comment error:", error);

        alert("Could not add comment.");
    }
}


function escapeHTML(value) {
    const div = document.createElement("div");

    div.textContent = value || "";

    return div.innerHTML;
}


/* ======================================================
   FULLSCREEN
   ====================================================== */

function toggleProfileFullscreen() {
    const video = document.getElementById(
        "profile-player-video"
    );

    if (!video) return;

    if (video.requestFullscreen) {
        video.requestFullscreen();

    } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
    }
}


/* ======================================================
   PROGRESS
   ====================================================== */

function getProfileProgressPercent(event) {
    const hitbox = document.getElementById(
        "profile-progress-hitbox"
    );

    if (!hitbox) return 0;

    const rect = hitbox.getBoundingClientRect();

    let percent =
        ((event.clientX - rect.left) / rect.width) * 100;

    return Math.max(
        0,
        Math.min(100, percent)
    );
}


function setProfileVideoPosition(event) {
    const video = document.getElementById(
        "profile-player-video"
    );

    if (
        !video ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
    ) {
        return;
    }

    const percent =
        getProfileProgressPercent(event);

    video.currentTime =
        (percent / 100) * video.duration;

    document.getElementById(
        "profile-progress"
    ).style.width =
        percent + "%";

    document.getElementById(
        "profile-player-time"
    ).textContent =
        formatProfileTime(video.currentTime) +
        " / " +
        formatProfileTime(video.duration);
}


function startProfileSeek(event) {
    const hitbox = document.getElementById(
        "profile-progress-hitbox"
    );

    if (!hitbox) return;

    profileSeekDragging = true;

    try {
        hitbox.setPointerCapture(
            event.pointerId
        );
    } catch (e) {}

    setProfileVideoPosition(event);

    event.preventDefault();
    event.stopPropagation();
}


function dragProfileSeek(event) {
    if (!profileSeekDragging) return;

    setProfileVideoPosition(event);

    event.preventDefault();
    event.stopPropagation();
}


function stopProfileSeek(event) {
    if (!profileSeekDragging) return;

    setProfileVideoPosition(event);

    const hitbox = document.getElementById(
        "profile-progress-hitbox"
    );

    try {
        if (
            hitbox &&
            hitbox.hasPointerCapture(
                event.pointerId
            )
        ) {
            hitbox.releasePointerCapture(
                event.pointerId
            );
        }
    } catch (e) {}

    profileSeekDragging = false;

    event.preventDefault();
    event.stopPropagation();
}


/* ======================================================
   TIME
   ====================================================== */

function formatProfileTime(seconds) {
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


/* ======================================================
   SHARE
   ====================================================== */

function copyProfileVideoLink() {
    if (!currentProfilePageUrl) {
        showCopyLinkNotification("Could not determine video URL.", true);
        return;
    }

    const fullUrl =
        window.location.origin +
        currentProfilePageUrl;

    copyTextWithNotification(
        fullUrl,
        "Video link copied successfully."
    );
}


/* ======================================================
   VIDEO EVENTS
   ====================================================== */

const profilePlayerVideo =
    document.getElementById(
        "profile-player-video"
    );

if (profilePlayerVideo) {

    profileViewTracker = createVideoViewTracker(
        profilePlayerVideo,
        addProfileVideoView
    );

    profilePlayerVideo.addEventListener(
        "loadedmetadata",
        function () {

            document.getElementById(
                "profile-player-time"
            ).textContent =
                "0:00 / " +
                formatProfileTime(
                    profilePlayerVideo.duration
                );

            updateProfileCenterIndicator();
        }
    );


    profilePlayerVideo.addEventListener(
        "play",
        function () {

            updateProfileCenterIndicator();
        }
    );


    profilePlayerVideo.addEventListener(
        "pause",
        function () {

            updateProfileCenterIndicator();
        }
    );


    profilePlayerVideo.addEventListener(
        "timeupdate",
        function () {

            const progress =
                document.getElementById(
                    "profile-progress"
                );

            const currentTime =
                document.getElementById(
                    "profile-player-time"
                );

            if (
                profilePlayerVideo.duration &&
                progress &&
                !profileSeekDragging
            ) {

                const percent =
                    (
                        profilePlayerVideo.currentTime /
                        profilePlayerVideo.duration
                    ) * 100;

                progress.style.width =
                    percent + "%";
            }


            if (currentTime) {

                currentTime.textContent =
                    formatProfileTime(
                        profilePlayerVideo.currentTime
                    ) +
                    " / " +
                    formatProfileTime(
                        profilePlayerVideo.duration
                    );
            }
        }
    );


    profilePlayerVideo.addEventListener(
        "ended",
        function () {

            const progress =
                document.getElementById(
                    "profile-progress"
                );

            if (progress) {
                progress.style.width = "100%";
            }

            updateProfileCenterIndicator();
        }
    );
}


/* ======================================================
   ESC
   ====================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            const comments =
                document.getElementById(
                    "profile-comments-overlay"
                );

            if (
                comments &&
                comments.classList.contains(
                    "comments-open"
                )
            ) {

                closeProfileComments();

            } else {

                closeProfileVideo();
            }
        }
    }
);


/* ======================================================
   DELETE VIDEO
   ====================================================== */

async function deleteProfileVideo(event, button) {

    event.preventDefault();
    event.stopPropagation();

    const videoId =
        button.dataset.videoId;

    if (!videoId) {
        return;
    }


    /* ==================================================
       CUSTOM DELETE WARNING
       ================================================== */

    const confirmed =
        await showDeleteVideoWarning();

    if (!confirmed) {
        return;
    }


    try {

        button.disabled = true;


        const response =
            await fetch(
                `/video/${videoId}/delete/`,
                {
                    method: "POST",

                    headers: {
                        "X-CSRFToken":
                            getCookie("csrftoken"),

                        "X-Requested-With":
                            "XMLHttpRequest"
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.error ||
                "Could not delete this video."
            );

            button.disabled = false;

            return;
        }


        /* ==============================================
           REMOVE VIDEO CARD
           ============================================== */

        const card =
            button.closest(
                ".profile-video-card"
            );


        if (card) {

            card.style.opacity = "0";

            card.style.transform =
                "scale(0.95)";

            card.style.transition =
                "0.2s ease";


            setTimeout(
                function () {
                    card.remove();
                },
                200
            );
        }


    } catch (error) {

        console.error(
            "Delete video error:",
            error
        );

        alert(
            "Could not delete this video."
        );

        button.disabled = false;
    }
}
