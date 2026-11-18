
document.addEventListener("DOMContentLoaded", function () {
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsMenu = document.getElementById("settingsMenu");

    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener("click", function (event) {
            event.stopPropagation();

            const isOpen = settingsMenu.classList.toggle("show");
            settingsBtn.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", function (event) {
            if (
                !settingsMenu.contains(event.target) &&
                !settingsBtn.contains(event.target)
            ) {
                settingsMenu.classList.remove("show");
                settingsBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) return;

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const messageDiv = document.getElementById("message");
    const submitButton = loginForm.querySelector(
        'button[type="submit"]'
    );

    function showMessage(type, message) {
        if (!messageDiv) return;

        messageDiv.className = "message " + type;
        messageDiv.textContent = message;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username) {
            showMessage(
                "error",
                "Please enter your student number or admin username."
            );
            return;
        }

        if (!password.trim()) {
            showMessage("error", "Please enter your password.");
            return;
        }

        if (submitButton) submitButton.disabled = true;

        showMessage("info", "Verifying your login...");

        try {
            const response = await fetch("../api/login.php", {
                method: "POST",
                body: new FormData(loginForm),
                credentials: "same-origin"
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                showMessage(
                    "error",
                    result.message || "Unable to log in."
                );
                return;
            }

            showMessage("success", result.message);

            window.location.href = result.redirect;
        } catch (error) {
            showMessage(
                "error",
                "Unable to contact the server. Please try again."
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});
