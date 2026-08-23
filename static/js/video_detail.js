/* ======================================================
   VIDEO DETAIL
====================================================== */

let videoDetailSeekDragging = false;

let videoDetailLiked = false;

let videoDetailViewTimer = null;

let videoDetailViewCounted = false;


/* ======================================================
   ELEMENTS
====================================================== */

const videoDetailPlayer =
    document.getElementById(
        "video-detail-player"
    );


/* ======================================================
   INIT
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (!videoDetailPlayer) {
            return;
        }


        /*
            Пока не используем liked из HTML.

            Состояние лайка можно получить
            через отдельный endpoint.
        */

        videoDetailLiked = false;

        updateVideoDetailLikeButton();

        updateVideoDetailCenterIndicator();

    }
);


/* ======================================================
   PLAY / PAUSE
====================================================== */

function toggleVideoDetailPlayer() {

    if (!videoDetailPlayer) {
        return;
    }


    if (videoDetailPlayer.paused) {

        videoDetailPlayer.play().catch(
            function (error) {

                console.error(
                    "Video play error:",
                    error
                );

            }
        );

    } else {

        videoDetailPlayer.pause();

    }

}


/* ======================================================
   CENTER PLAY ICON
====================================================== */

function updateVideoDetailCenterIndicator() {

    const container =
        document.getElementById(
            "video-detail-center-play"
        );


    const icon =
        document.getElementById(
            "video-detail-center-icon"
        );


    if (
        !container ||
        !icon ||
        !videoDetailPlayer
    ) {
        return;
    }


    if (videoDetailPlayer.paused) {

        icon.textContent = "▶";

        container.style.opacity = "1";

    } else {

        icon.textContent = "❚❚";

        container.style.opacity = "0";

    }

}


/* ======================================================
   VIDEO EVENTS
====================================================== */

if (videoDetailPlayer) {


    videoDetailPlayer.addEventListener(
        "play",
        function () {

            updateVideoDetailCenterIndicator();

            startVideoDetailViewTimer();

        }
    );


    videoDetailPlayer.addEventListener(
        "pause",
        function () {

            updateVideoDetailCenterIndicator();

            stopVideoDetailViewTimer();

        }
    );


    videoDetailPlayer.addEventListener(
        "loadedmetadata",
        function () {

            updateVideoDetailTime();

            updateVideoDetailCenterIndicator();

        }
    );


    videoDetailPlayer.addEventListener(
        "timeupdate",
        function () {

            updateVideoDetailProgress();

            updateVideoDetailTime();

        }
    );


    videoDetailPlayer.addEventListener(
        "ended",
        function () {

            const progress =
                document.getElementById(
                    "video-detail-progress"
                );


            if (progress) {

                progress.style.width = "100%";

            }


            stopVideoDetailViewTimer();

            updateVideoDetailCenterIndicator();

        }
    );

}


/* ======================================================
   VIEW COUNTER
====================================================== */

function startVideoDetailViewTimer() {

    stopVideoDetailViewTimer();


    if (videoDetailViewCounted) {
        return;
    }


    videoDetailViewTimer =
        setTimeout(
            function () {

                addVideoDetailView();

            },
            3000
        );

}


function stopVideoDetailViewTimer() {

    if (
        videoDetailViewTimer !== null
    ) {

        clearTimeout(
            videoDetailViewTimer
        );

        videoDetailViewTimer = null;

    }

}


async function addVideoDetailView() {

    if (
        videoDetailViewCounted ||
        !window.VIDEO_DETAIL_ID
    ) {
        return;
    }


    videoDetailViewCounted = true;

    stopVideoDetailViewTimer();


    try {

        const response =
            await fetch(
                `/video/${window.VIDEO_DETAIL_ID}/view/`,
                {
                    method: "POST",

                    headers: {
                        "X-CSRFToken":
                            getVideoDetailCookie(
                                "csrftoken"
                            ),

                        "X-Requested-With":
                            "XMLHttpRequest"
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "View error:",
                data
            );

            videoDetailViewCounted = false;

            return;

        }


        if (
            data.views_count !== undefined
        ) {

            const count =
                document.getElementById(
                    "video-detail-view-count"
                );


            if (count) {

                count.textContent =
                    "👁 " +
                    data.views_count +
                    " views";

            }

        }


    } catch (error) {

        console.error(
            "View request error:",
            error
        );

        videoDetailViewCounted = false;

    }

}


/* ======================================================
   LIKE BUTTON
====================================================== */

function updateVideoDetailLikeButton() {

    const button =
        document.getElementById(
            "video-detail-like-button"
        );


    if (!button) {
        return;
    }


    if (videoDetailLiked) {

        button.classList.add(
            "liked"
        );

    } else {

        button.classList.remove(
            "liked"
        );

    }

}


/* ======================================================
   LIKE
====================================================== */

async function toggleVideoDetailLike() {

    if (!window.VIDEO_DETAIL_ID) {
        return;
    }


    try {

        const response =
            await fetch(
                `/video/${window.VIDEO_DETAIL_ID}/like/`,
                {
                    method: "POST",

                    headers: {
                        "X-CSRFToken":
                            getVideoDetailCookie(
                                "csrftoken"
                            ),

                        "X-Requested-With":
                            "XMLHttpRequest"
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Like error:",
                data
            );

            return;

        }


        videoDetailLiked =
            Boolean(data.liked);


        const count =
            document.getElementById(
                "video-detail-like-count"
            );


        if (count) {

            count.textContent =
                data.likes_count;

        }


        updateVideoDetailLikeButton();


    } catch (error) {

        console.error(
            "Like request error:",
            error
        );

    }

}


/* ======================================================
   COMMENTS OPEN
====================================================== */

function openVideoDetailComments() {

    const overlay =
        document.getElementById(
            "video-detail-comments-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "comments-closed"
    );

    overlay.classList.add(
        "comments-open"
    );


    loadVideoDetailComments();

}


/* ======================================================
   COMMENTS CLOSE
====================================================== */

function closeVideoDetailComments() {

    const overlay =
        document.getElementById(
            "video-detail-comments-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "comments-open"
    );

    overlay.classList.add(
        "comments-closed"
    );

}


/* ======================================================
   LOAD COMMENTS
====================================================== */

async function loadVideoDetailComments() {

    if (!window.VIDEO_DETAIL_ID) {
        return;
    }


    const list =
        document.getElementById(
            "video-detail-comments-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="comments-loading">
            Loading comments...
        </div>
    `;


    try {

        const response =
            await fetch(
                `/video/${window.VIDEO_DETAIL_ID}/comments/`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                "Comments request failed"
            );

        }


        list.innerHTML = "";


        const comments =
            data.comments || [];


        const count =
            comments.length;


        const titleCount =
            document.getElementById(
                "video-detail-comments-title-count"
            );


        const commentCount =
            document.getElementById(
                "video-detail-comment-count"
            );


        if (titleCount) {

            titleCount.textContent =
                count +
                (
                    count === 1
                        ? " comment"
                        : " comments"
                );

        }


        if (commentCount) {

            commentCount.textContent =
                count;

        }


        if (count === 0) {

            list.innerHTML = `
                <div class="
                    comments-loading
                ">
                    💬<br><br>
                    No comments yet
                </div>
            `;

            return;

        }


        comments.forEach(
            function (comment) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "comment-item";


                let avatarHTML;


                if (comment.avatar) {

                    avatarHTML = `
                        <img
                            src="${escapeVideoDetailHTML(
                                comment.avatar
                            )}"
                            class="comment-avatar"
                            alt=""
                        >
                    `;

                } else {

                    avatarHTML = `
                        <div class="comment-avatar-placeholder">
                            ${escapeVideoDetailHTML(
                                (
                                    comment.username ||
                                    "?"
                                )
                                .slice(0, 1)
                                .toUpperCase()
                            )}
                        </div>
                    `;

                }


                item.innerHTML = `
                    ${avatarHTML}

                    <div class="comment-content">

                        <div class="comment-username">
                            @${escapeVideoDetailHTML(
                                comment.username
                            )}
                        </div>

                        <p class="comment-text">
                            ${escapeVideoDetailHTML(
                                comment.text
                            )}
                        </p>

                        <span class="comment-date">
                            ${escapeVideoDetailHTML(
                                comment.created_at
                            )}
                        </span>

                    </div>
                `;


                list.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "Comments error:",
            error
        );


        list.innerHTML = `
            <div class="
                comments-loading
                error
            ">
                Could not load comments.
            </div>
        `;

    }

}


/* ======================================================
   ADD COMMENT
====================================================== */

async function submitVideoDetailComment(
    event
) {

    event.preventDefault();


    if (!window.VIDEO_DETAIL_ID) {
        return;
    }


    const input =
        document.getElementById(
            "video-detail-comment-input"
        );


    if (!input) {
        return;
    }


    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    const formData =
        new FormData();


    formData.append(
        "text",
        text
    );


    try {

        const response =
            await fetch(
                `/video/${window.VIDEO_DETAIL_ID}/comments/add/`,
                {
                    method: "POST",

                    headers: {
                        "X-CSRFToken":
                            getVideoDetailCookie(
                                "csrftoken"
                            )
                    },

                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Could not add comment."
            );

            return;

        }


        input.value = "";


        await loadVideoDetailComments();


    } catch (error) {

        console.error(
            "Add comment error:",
            error
        );


        alert(
            "Could not add comment."
        );

    }

}


/* ======================================================
   SEEK
====================================================== */

function getVideoDetailProgressPercent(
    event
) {

    const hitbox =
        document.getElementById(
            "video-detail-progress-hitbox"
        );


    if (!hitbox) {
        return 0;
    }


    const rect =
        hitbox.getBoundingClientRect();


    let percent =
        (
            (event.clientX - rect.left) /
            rect.width
        ) * 100;


    return Math.max(
        0,
        Math.min(100, percent)
    );

}


function setVideoDetailPosition(
    event
) {

    if (!videoDetailPlayer) {
        return;
    }


    if (
        !Number.isFinite(
            videoDetailPlayer.duration
        ) ||
        videoDetailPlayer.duration <= 0
    ) {
        return;
    }


    const percent =
        getVideoDetailProgressPercent(
            event
        );


    videoDetailPlayer.currentTime =
        (
            percent / 100
        ) *
        videoDetailPlayer.duration;


    const progress =
        document.getElementById(
            "video-detail-progress"
        );


    if (progress) {

        progress.style.width =
            percent + "%";

    }


    updateVideoDetailTime();

}


function startVideoDetailSeek(
    event
) {

    const hitbox =
        document.getElementById(
            "video-detail-progress-hitbox"
        );


    if (!hitbox) {
        return;
    }


    videoDetailSeekDragging = true;


    try {

        hitbox.setPointerCapture(
            event.pointerId
        );

    } catch (error) {}


    setVideoDetailPosition(
        event
    );


    event.preventDefault();

    event.stopPropagation();

}


function dragVideoDetailSeek(
    event
) {

    if (!videoDetailSeekDragging) {
        return;
    }


    setVideoDetailPosition(
        event
    );


    event.preventDefault();

    event.stopPropagation();

}


function stopVideoDetailSeek(
    event
) {

    if (!videoDetailSeekDragging) {
        return;
    }


    setVideoDetailPosition(
        event
    );


    const hitbox =
        document.getElementById(
            "video-detail-progress-hitbox"
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

    } catch (error) {}


    videoDetailSeekDragging = false;


    event.preventDefault();

    event.stopPropagation();

}


/* ======================================================
   PROGRESS UPDATE
====================================================== */

function updateVideoDetailProgress() {

    if (!videoDetailPlayer) {
        return;
    }


    const progress =
        document.getElementById(
            "video-detail-progress"
        );


    if (
        !progress ||
        videoDetailSeekDragging
    ) {
        return;
    }


    if (
        !Number.isFinite(
            videoDetailPlayer.duration
        ) ||
        videoDetailPlayer.duration <= 0
    ) {
        return;
    }


    const percent =
        (
            videoDetailPlayer.currentTime /
            videoDetailPlayer.duration
        ) * 100;


    progress.style.width =
        percent + "%";

}


/* ======================================================
   TIME
====================================================== */

function updateVideoDetailTime() {

    if (!videoDetailPlayer) {
        return;
    }


    const time =
        document.getElementById(
            "video-detail-time"
        );


    if (!time) {
        return;
    }


    time.textContent =
        formatVideoDetailTime(
            videoDetailPlayer.currentTime
        ) +
        " / " +
        formatVideoDetailTime(
            videoDetailPlayer.duration
        );

}


function formatVideoDetailTime(
    seconds
) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    const secs =
        Math.floor(
            seconds % 60
        );


    return (
        minutes +
        ":" +
        String(secs).padStart(
            2,
            "0"
        )
    );

}


/* ======================================================
   FULLSCREEN
====================================================== */

function toggleVideoDetailFullscreen() {

    if (!videoDetailPlayer) {
        return;
    }


    if (
        document.fullscreenElement
    ) {

        document.exitFullscreen();

        return;

    }


    if (
        videoDetailPlayer.requestFullscreen
    ) {

        videoDetailPlayer.requestFullscreen();

    } else if (
        videoDetailPlayer.webkitEnterFullscreen
    ) {

        videoDetailPlayer.webkitEnterFullscreen();

    }

}


/* ======================================================
   SHARE
====================================================== */

function copyVideoDetailLink() {

    const url =
        window.location.href;


    if (navigator.clipboard) {

        navigator.clipboard.writeText(
            url
        )
        .then(
            function () {

                alert(
                    "Video link copied!"
                );

            }
        )
        .catch(
            function () {

                alert(
                    "Could not copy the link."
                );

            }
        );

    } else {

        alert(
            "Could not copy the link."
        );

    }

}


/* ======================================================
   CSRF
====================================================== */

function getVideoDetailCookie(
    name
) {

    let cookieValue = null;


    if (
        document.cookie &&
        document.cookie !== ""
    ) {

        const cookies =
            document.cookie.split(";");


        for (
            let i = 0;
            i < cookies.length;
            i++
        ) {

            const cookie =
                cookies[i].trim();


            if (
                cookie.substring(
                    0,
                    name.length + 1
                ) ===
                name + "="
            ) {

                cookieValue =
                    decodeURIComponent(
                        cookie.substring(
                            name.length + 1
                        )
                    );

                break;

            }

        }

    }


    return cookieValue;

}


/* ======================================================
   ESCAPE HTML
====================================================== */

function escapeVideoDetailHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value || "";


    return div.innerHTML;

}


/* ======================================================
   ESC KEY
====================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !== "Escape"
        ) {
            return;
        }


        const comments =
            document.getElementById(
                "video-detail-comments-overlay"
            );


        if (
            comments &&
            comments.classList.contains(
                "comments-open"
            )
        ) {

            closeVideoDetailComments();

        }

    }
);