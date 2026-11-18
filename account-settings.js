
document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "../api/account_settings.php";

    const profileForm = document.getElementById("profileForm");
    const passwordForm = document.getElementById("passwordForm");
    const messageBox = document.getElementById("settingsMessage");

    const adminIdInput = document.getElementById("adminId");
    const adminRoleInput = document.getElementById("adminRole");
    const fullNameInput = document.getElementById("fullName");
    const createdAtInput = document.getElementById("createdAt");
    const headerAdminName = document.getElementById("headerAdminName");

    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const changePasswordBtn = document.getElementById("changePasswordBtn");

    const logoutBtn = document.getElementById("logoutBtn");
    const logoutModal = document.getElementById("logoutModal");
    const cancelLogout = document.getElementById("cancelLogout");
    const confirmLogout = document.getElementById("confirmLogout");

    const adminManagementPanel =
        document.getElementById("adminManagementPanel");

    const backButtons = [
        document.getElementById("backToDashboardBtn"),
        document.getElementById("backToDashboardBtnBottom")
    ];

    let isSuperAdmin = false;

    function showMessage(message, type) {
        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.className = "settings-message " + type;
        messageBox.hidden = false;
    }

    // =====================================
    // API REQUEST WITH SAFE JSON HANDLING
    // =====================================

    async function requestApi(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            ...options,
            headers: {
                "Accept": "application/json",
                ...(options.headers || {})
            }
        });

        // Read the response as text first so invalid JSON
        // can be handled without causing a parsing crash.
        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (error) {
            throw new Error(
                "The Account Settings API returned an invalid response. " +
                "Check api/account_settings.php and confirm that it returns JSON."
            );
        }

        if (response.status === 401) {
            window.location.href = "login.html";

            throw new Error(
                "Your session has expired. Please log in again."
            );
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "The request failed."
            );
        }

        return data;
    }

    // =====================================
    // LOAD ADMIN PROFILE
    // =====================================

    async function loadProfile() {
        try {
            const data = await requestApi(API_URL);
            const admin = data.admin;

            if (!admin) {
                throw new Error(
                    "The server did not return administrator details."
                );
            }

            if (adminIdInput) {
                adminIdInput.value = admin.admin_id || "";
            }

            if (adminRoleInput) {
                adminRoleInput.value = admin.is_super_admin
                    ? "Super Admin"
                    : "Administrator";
            }

            if (fullNameInput) {
                fullNameInput.value = admin.full_name || "";
            }

            if (createdAtInput) {
                createdAtInput.value = admin.created_at || "—";
            }

            if (headerAdminName) {
                headerAdminName.textContent =
                    admin.full_name || "Administrator";
            }

            // Accept either a JSON boolean or numeric 1.
            isSuperAdmin =
                admin.is_super_admin === true ||
                admin.is_super_admin === 1 ||
                admin.is_super_admin === "1";

            // This only controls visibility. The PHP API must
            // independently enforce Super Admin permissions.
            if (adminManagementPanel) {
                adminManagementPanel.hidden = !isSuperAdmin;
            }

        } catch (error) {
            showMessage(
                error.message || "Unable to load account settings.",
                "error"
            );
        }
    }

    // =====================================
    // UPDATE PROFILE
    // =====================================

    if (profileForm) {
        profileForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (saveProfileBtn) {
                saveProfileBtn.disabled = true;
            }

            try {
                const data = await requestApi(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action: "update_profile",
                        full_name: fullNameInput
                            ? fullNameInput.value.trim()
                            : ""
                    })
                });

                if (headerAdminName) {
                    headerAdminName.textContent = data.full_name || "";
                }

                showMessage(
                    data.message || "Profile updated successfully.",
                    "success"
                );

            } catch (error) {
                showMessage(
                    error.message || "Unable to update your profile.",
                    "error"
                );

            } finally {
                if (saveProfileBtn) {
                    saveProfileBtn.disabled = false;
                }
            }
        });
    }

    // =====================================
    // CHANGE PASSWORD
    // =====================================

    if (passwordForm) {
        passwordForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const currentPassword =
                document.getElementById("currentPassword")?.value || "";

            const newPassword =
                document.getElementById("newPassword")?.value || "";

            const confirmPassword =
                document.getElementById("confirmPassword")?.value || "";

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                showMessage(
                    "Please complete all password fields.",
                    "error"
                );
                return;
            }

            if (newPassword.length < 8) {
                showMessage(
                    "Your new password must be at least 8 characters.",
                    "error"
                );
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage(
                    "The new passwords do not match.",
                    "error"
                );
                return;
            }

            if (changePasswordBtn) {
                changePasswordBtn.disabled = true;
            }

            try {
                const data = await requestApi(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action: "change_password",
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });

                passwordForm.reset();

                showMessage(
                    data.message || "Password changed successfully.",
                    "success"
                );

            } catch (error) {
                showMessage(
                    error.message || "Unable to change your password.",
                    "error"
                );

            } finally {
                if (changePasswordBtn) {
                    changePasswordBtn.disabled = false;
                }
            }
        });
    }

    // =====================================
    // BACK TO ADMIN DASHBOARD
    // =====================================

    backButtons.forEach(function (button) {
        if (button) {
            button.addEventListener("click", function () {
                window.location.href = "admin.html";
            });
        }
    });

    // =====================================
    // LOGOUT CONFIRMATION
    // =====================================

    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener("click", function () {
            logoutModal.classList.add("active");
        });
    }

    if (cancelLogout && logoutModal) {
        cancelLogout.addEventListener("click", function () {
            logoutModal.classList.remove("active");
        });
    }

    if (logoutModal) {
        logoutModal.addEventListener("click", function (event) {
            if (event.target === logoutModal) {
                logoutModal.classList.remove("active");
            }
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener("click", async function () {
            confirmLogout.disabled = true;

            try {
                const response = await fetch("../api/logout.php", {
                    method: "POST",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Accept": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error("Logout request failed.");
                }

            } catch (error) {
                // Still redirect so the user can leave this page.
            } finally {
                localStorage.removeItem("userRole");
                window.location.href = "login.html";
            }
        });
    }

    // =====================================
    // INITIALIZE PAGE
    // =====================================

    loadProfile();
});
