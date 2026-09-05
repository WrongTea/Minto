document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const button = document.getElementById("register-button");
    const errorBox = document.getElementById("register-error");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Сброс ошибки
        if (errorBox) {
            errorBox.textContent = "";
            errorBox.classList.remove("visible");
        }

        const password = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password_confirm").value;

        // Валидация совпадения паролей на клиенте
        if (password !== passwordConfirm) {
            showError("Passwords do not match.");
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Creating account...";
        }

        const formData = new FormData(form);

        try {
            const response = await fetch("/register/", {
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
                window.location.href = data.redirect || "/login/";
                return;
            }

            showError(data.error || "Registration failed.");

        } catch (error) {
            console.error("Register error:", error);
            showError("Something went wrong. Please try again.");
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Sign up";
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