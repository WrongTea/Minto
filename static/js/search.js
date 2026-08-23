// ============================================================
// SEARCH PAGE
// ============================================================

const peopleList =
    document.getElementById(
        "people-list"
    );

const peopleLeft =
    document.getElementById(
        "people-left"
    );

const peopleRight =
    document.getElementById(
        "people-right"
    );


// ============================================================
// UPDATE ARROWS
// ============================================================

function updatePeopleArrows() {

    if (!peopleList) {
        return;
    }


    const maxScroll =
        peopleList.scrollWidth -
        peopleList.clientWidth;


    // --------------------------------------------------------
    // EVERYTHING FITS
    // --------------------------------------------------------

    if (maxScroll <= 1) {

        peopleLeft.classList.add(
            "hidden"
        );

        peopleRight.classList.add(
            "hidden"
        );

        return;
    }


    // --------------------------------------------------------
    // LEFT
    // --------------------------------------------------------

    if (
        peopleList.scrollLeft > 1
    ) {

        peopleLeft.classList.remove(
            "hidden"
        );

    } else {

        peopleLeft.classList.add(
            "hidden"
        );

    }


    // --------------------------------------------------------
    // RIGHT
    // --------------------------------------------------------

    if (
        peopleList.scrollLeft <
        maxScroll - 1
    ) {

        peopleRight.classList.remove(
            "hidden"
        );

    } else {

        peopleRight.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// LEFT BUTTON
// ============================================================

if (peopleLeft) {

    peopleLeft.addEventListener(
        "click",
        function () {

            peopleList.scrollBy({
                left: -350,
                behavior: "smooth"
            });

        }
    );

}


// ============================================================
// RIGHT BUTTON
// ============================================================

if (peopleRight) {

    peopleRight.addEventListener(
        "click",
        function () {

            peopleList.scrollBy({
                left: 350,
                behavior: "smooth"
            });

        }
    );

}


// ============================================================
// SCROLL
// ============================================================

if (peopleList) {

    peopleList.addEventListener(
        "scroll",
        function () {

            updatePeopleArrows();

        }
    );

}


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    function () {

        updatePeopleArrows();

    }
);


// ============================================================
// INITIAL CHECK
// ============================================================

updatePeopleArrows();