const avatarInput = document.getElementById("avatar");

if (avatarInput) {
    avatarInput.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please choose an image.");
            this.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            const avatarContainer = document.querySelector(
                ".edit-profile-avatar"
            );

            avatarContainer.innerHTML = `
                <img
                    id="avatar-preview"
                    src="${event.target.result}"
                    alt="Profile picture"
                >
            `;
        };

        reader.readAsDataURL(file);
    });
}