let deleteVideoWarningResolver = null;


/* ======================================================
   OPEN WARNING
   ====================================================== */

function showDeleteVideoWarning() {
    return new Promise(function (resolve) {
        const modal = document.getElementById("delete-video-modal");

        if (!modal) {
            console.error("Delete video modal not found.");
            resolve(false);
            return;
        }

        deleteVideoWarningResolver = resolve;

        modal.classList.add("show");
        document.body.classList.add("overflow-hidden");

        const cancelButton = document.getElementById(
            "delete-video-modal-cancel"
        );

        if (cancelButton) {
            cancelButton.focus();
        }
    });
}


/* ======================================================
   CLOSE WARNING
   ====================================================== */

function closeDeleteVideoWarning(result) {
    const modal = document.getElementById("delete-video-modal");

    if (!modal) {
        return;
    }

    modal.classList.remove("show");
    document.body.classList.remove("overflow-hidden");

    if (deleteVideoWarningResolver) {
        const resolver = deleteVideoWarningResolver;

        deleteVideoWarningResolver = null;

        resolver(result);
    }
}


/* ======================================================
   CANCEL
   ====================================================== */

function cancelDeleteVideoWarning() {
    closeDeleteVideoWarning(false);
}


/* ======================================================
   CONFIRM
   ====================================================== */

function confirmDeleteVideoWarning() {
    closeDeleteVideoWarning(true);
}


/* ======================================================
   INITIALIZATION
   ====================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("delete-video-modal");

    if (!modal) {
        return;
    }


    /* =========================
       CANCEL BUTTON
       ========================= */

    const cancelButton = document.getElementById(
        "delete-video-modal-cancel"
    );

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            cancelDeleteVideoWarning
        );
    }


    /* =========================
       CONFIRM BUTTON
       ========================= */

    const confirmButton = document.getElementById(
        "delete-video-modal-confirm"
    );

    if (confirmButton) {
        confirmButton.addEventListener(
            "click",
            confirmDeleteVideoWarning
        );
    }


    /* =========================
       CLICK OUTSIDE
       ========================= */

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            cancelDeleteVideoWarning();
        }
    });
});


/* ======================================================
   ESC
   ====================================================== */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        const modal = document.getElementById(
            "delete-video-modal"
        );

        if (
            modal &&
            modal.classList.contains("show")
        ) {
            cancelDeleteVideoWarning();
        }
    }
});