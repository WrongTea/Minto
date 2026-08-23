const videoInput = document.getElementById("id_video_file");
const uploadTitle = document.getElementById("upload-title");
const uploadSubtitle = document.getElementById("upload-subtitle");

videoInput.addEventListener("change", function () {

    if (videoInput.files.length > 0) {

        const file = videoInput.files[0];

        uploadTitle.textContent = file.name;

        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

        uploadSubtitle.textContent = `${sizeMB} MB`;

    } else {

        uploadTitle.textContent = "Choose a video";
        uploadSubtitle.textContent = "MP4, MOV, AVI or WEBM";

    }

});


const description = document.getElementById("id_description");
const charCount = document.getElementById("char-count");

description.addEventListener("input", function () {

    charCount.textContent =
        `${description.value.length} / 200`;

});