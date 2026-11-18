// =====================================
//       SHARED COMPONENTS
// =====================================

(function () {
    "use strict";

    // =====================================
    //          SHARED THEME
    // =====================================

    function applyTheme(theme, savePreference = false) {
        const selectedTheme = theme === "dark" ? "dark" : "light";

        document.body.classList.toggle(
            "dark-mode",
            selectedTheme === "dark"
        );

        if (savePreference) {
            localStorage.setItem("theme", selectedTheme);

            document.dispatchEvent(
                new CustomEvent("queueski:theme-changed", {
                    detail: { theme: selectedTheme }
                })
            );
        }
    }


    // =====================================
    //       INITIALIZE THEME
    // =====================================

    function initializeTheme() {
        applyTheme(localStorage.getItem("theme") || "light");

        window.addEventListener("storage", function (event) {
            if (event.key === "theme") {
                const theme = event.newValue || "light";

                applyTheme(theme);

                document.dispatchEvent(
                    new CustomEvent("queueski:theme-changed", {
                        detail: { theme: theme }
                    })
                );
            }
        });
    }


    // =====================================
    //          SETTINGS MENU
    // =====================================

    function initializeSettings(container, isAdmin) {
        const settingsBtn = container.querySelector("#settingsBtn");
        const settingsMenu = container.querySelector("#settingsMenu");
        const themeToggle = container.querySelector("#themeToggle");
        const logoutBtn = container.querySelector("#settingsLogoutBtn");

        if (!settingsBtn || !settingsMenu) {
            return;
        }


        // =====================================
        //          CLOSE SETTINGS MENU
        // =====================================

        function closeMenu() {
            settingsMenu.classList.remove("show");
            settingsBtn.setAttribute("aria-expanded", "false");
        }


        // =====================================
        //       OPEN AND CLOSE DROPDOWN
        // =====================================

        settingsBtn.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const isOpen = settingsMenu.classList.toggle("show");

            settingsBtn.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });


        // =====================================
        //       CLOSE MENU OUTSIDE CLICK
        // =====================================

        document.addEventListener("click", function (event) {
            if (!container.contains(event.target)) {
                closeMenu();
            }
        });


        // =====================================
        //          CLOSE MENU WITH ESCAPE
        // =====================================

        document.addEventListener("keydown", function (event) {
            if (
                event.key === "Escape" &&
                settingsMenu.classList.contains("show")
            ) {
                closeMenu();
                settingsBtn.focus();
            }
        });


        // =====================================
        //         LIGHT / DARK MODE
        // =====================================

        if (themeToggle) {
            themeToggle.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                const currentlyDark =
                    document.body.classList.contains("dark-mode");

                applyTheme(currentlyDark ? "light" : "dark", true);
            });
        }


        // =====================================
        //             STUDENT LOGOUT
        // =====================================

        if (logoutBtn && !isAdmin) {
            logoutBtn.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                localStorage.removeItem("studentNumber");
                localStorage.removeItem("userRole");

                window.location.assign("/queueski/pages/login.html");
            });
        }


        // =====================================
        //        PLACEHOLDER SETTINGS LINKS
        // =====================================

        container.querySelectorAll("a[data-setting]").forEach(
            function (link) {
                link.addEventListener("click", function (event) {
                    event.preventDefault();

                    const setting = link.dataset.setting;

                    document.dispatchEvent(
                        new CustomEvent("queueski:setting-selected", {
                            detail: {
                                setting: setting,
                                isAdmin: isAdmin
                            }
                        })
                    );
                });
            }
        );
    }


    // =====================================
    //         LOAD HTML COMPONENT
    // =====================================

    async function loadComponent(container, path) {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(
                "Could not load " + path +
                " (HTTP " + response.status + ")"
            );
        }

        container.innerHTML = await response.text();
    }


    // =====================================
    //           STUDENT NAVBAR
    // =====================================

    async function loadStudentNavbar() {
        const container = document.getElementById(
            "sharedStudentNavbar"
        );

        if (!container) {
            return;
        }

        try {
            await loadComponent(
                container,
                "../components/student-navbar.html"
            );

            const page = container.dataset.page || "home";

            const pageTitles = {
                home: "HOME",
                profile: "PROFILE",
                accounting: "ACCOUNTING",
                registrar: "REGISTRAR / RIC"
            };

            const brand = container.querySelector("#studentNavBrand");
            const title = container.querySelector("#studentNavTitle");

            if (title) {
                title.textContent = pageTitles[page] || "HOME";
            }


            // =====================================
            //          LOGO NAVIGATION
            // =====================================

            if (brand) {
                function goHome() {
                    window.location.assign("/queueski/pages/home.html");
                }

                brand.addEventListener("click", goHome);

                brand.addEventListener("keydown", function (event) {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        goHome();
                    }
                });
            }


            // =====================================
            //        INITIALIZE STUDENT SETTINGS
            // =====================================

            initializeSettings(container, false);

            document.dispatchEvent(
                new CustomEvent("queueski:student-navbar-loaded")
            );

        } catch (error) {
            console.error(
                "QUEUESKI student navbar error:",
                error
            );

            container.innerHTML =
                '<p class="component-error">' +
                'Navigation could not be loaded. ' +
                'Please check the component filename and refresh.' +
                '</p>';
        }
    }


    // =====================================
    //            ADMIN SETTINGS
    // =====================================

    async function loadAdminSettings() {
        const container = document.getElementById(
            "sharedSettingsContainer"
        );

        if (!container) {
            return;
        }

        try {
            await loadComponent(
                container,
                "../components/admin-settings.html"
            );

            initializeSettings(container, true);

            document.dispatchEvent(
                new CustomEvent("queueski:admin-settings-loaded")
            );

        } catch (error) {
            console.error(
                "QUEUESKI admin settings error:",
                error
            );

            container.innerHTML =
                '<p class="component-error">' +
                'Settings could not be loaded. ' +
                'Please check the component filename and refresh.' +
                '</p>';
        }
    }


    // =====================================
    //       INITIALIZE SHARED COMPONENTS
    // =====================================

    function initialize() {
        initializeTheme();

        loadStudentNavbar();
        loadAdminSettings();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }

})();
