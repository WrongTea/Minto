// ============================================================
// BASE.JS
// ============================================================


// ============================================================
// SEARCH
// ============================================================

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");


if (searchForm && searchInput) {

    searchForm.addEventListener("submit", function (event) {

        const query = searchInput.value.trim();

        // Если поле пустое — не переходим на /search/?q=
        if (!query) {

            event.preventDefault();

            return;
        }

    });

}