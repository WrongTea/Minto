document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const button = document.getElementById("login-button");
    const errorBox = document.getElementById("login-error");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Блокирует перезагрузку и отправку HTML-формы

        if (errorBox) {
            errorBox.textContent = "";
            errorBox.classList.remove("visible");
        }

        if (button) {
            button.disabled = true;
            button.classList.add("loading");
        }

        const formData = new FormData(form);

        try {
            const response = await fetch("/login/", {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRFToken": getCookie("csrftoken"),
                    "X-Requested-With": "XMLHttpRequest"
                },
                credentials: "same-origin"
            });

            const data = await response.json();

            if (data.success) {
                // Перенаправление на главную страницу
                window.location.href = data.redirect || "/";
                return;
            }

            showError(data.error || "Login failed.");

        } catch (error) {
            console.error("Login error:", error);
            showError("Something went wrong. Please try again.");
        } finally {
            if (button) {
                button.classList.remove("loading");
                button.disabled = false;
            }
        }
    });

    function showError(message) {
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.classList.add("visible");
        }
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});