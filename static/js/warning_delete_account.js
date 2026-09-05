document.addEventListener("DOMContentLoaded", function () {

    const deleteButton = document.getElementById("deleteAccountButton");
    const modal = document.getElementById("deleteAccountModal");
    const cancelButton = document.getElementById("deleteAccountCancel");
    const confirmButton = document.getElementById("deleteAccountConfirm");

    if (!deleteButton || !modal || !cancelButton || !confirmButton) {
        return;
    }


    // ================= OPEN MODAL =================

    deleteButton.addEventListener("click", function () {
        modal.classList.add("show");
    });


    // ================= CANCEL =================

    cancelButton.addEventListener("click", function () {
        modal.classList.remove("show");
    });


    // ================= CLICK OUTSIDE =================

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });


    // ================= ESCAPE =================

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            modal.classList.remove("show");
        }

    });


    // ================= DELETE ACCOUNT =================

    confirmButton.addEventListener("click", async function () {

        confirmButton.disabled = true;
        confirmButton.textContent = "Deleting...";

        try {

            const response = await fetch("/delete-account/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken"),
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {

                // Account deleted successfully.
                // Django logs the user out in views.py.
                window.location.href = "/";

            } else {

                alert(data.error || "Failed to delete account.");

                confirmButton.disabled = false;
                confirmButton.textContent = "Delete account";
            }

        } catch (error) {

            console.error("Delete account error:", error);

            alert("Something went wrong. Please try again.");

            confirmButton.disabled = false;
            confirmButton.textContent = "Delete account";
        }

    });


    // ================= CSRF =================

    function getCookie(name) {

        let cookieValue = null;

        if (document.cookie && document.cookie !== "") {

            const cookies = document.cookie.split(";");

            for (let cookie of cookies) {

                cookie = cookie.trim();

                if (cookie.startsWith(name + "=")) {

                    cookieValue = decodeURIComponent(
                        cookie.substring(name.length + 1)
                    );

                    break;
                }
            }
        }

        return cookieValue;
    }

});