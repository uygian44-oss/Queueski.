document.addEventListener("DOMContentLoaded", function () {
    // =====================================
    // ELEMENTS
    // =====================================

    const settingsBtn = document.getElementById("settingsBtn");
    const settingsMenu = document.getElementById("settingsMenu");
    const themeToggleBtn = document.getElementById("themeToggle");
    const logoutBtn = document.getElementById("logoutBtn");

    const nowServingNum = document.getElementById("nowServingNum");
    const preparingList = document.getElementById("preparingList");
    const userTicketNum = document.getElementById("userTicketNum");

    const accountingLedgerBody =
        document.getElementById("accountingLedgerBody");

    const checkoutBtn = document.getElementById("checkoutBtn");
    const downloadSoaBtn = document.getElementById("downloadSoaBtn");

    // The page is inside /pages/, while the API is inside /api/.
    const API_URL = "../api/accounting.php";
    const SESSION_URL = "../api/session.php";

    let studentInfo = null;
    let refreshTimer = null;
    let isRequestingTicket = false;

    // =====================================
    // THEME
    // =====================================

    function applySavedTheme() {
        const savedTheme = localStorage.getItem("theme");

        document.body.classList.toggle(
            "dark-mode",
            savedTheme === "dark"
        );
    }

    applySavedTheme();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", function (event) {
            event.preventDefault();

            const isDark =
                document.body.classList.toggle("dark-mode");

            localStorage.setItem(
                "theme",
                isDark ? "dark" : "light"
            );
        });
    }

    // =====================================
    // SETTINGS MENU
    // =====================================

    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            settingsMenu.classList.toggle("show");
        });

        settingsMenu.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        document.addEventListener("click", function () {
            settingsMenu.classList.remove("show");
        });
    }

    // =====================================
    // HELPER: FETCH JSON
    // =====================================

    async function fetchJSON(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            ...options,
            headers: {
                Accept: "application/json",
                ...(options.headers || {})
            }
        });

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (response.status === 401) {
            console.error("401 LOGIN REDIRECT:", {
                url: response.url,
                status: response.status
            });

            debugger;

            window.location.href = "login.html";
            throw new Error("Your session has expired. Please log in again.");
        }

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || "The request could not be completed."
            );
        }

        return result;
    }

    // =====================================
    // HELPER: DISPLAY TICKET
    // =====================================

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    function formatTicket(ticket) {
        return ticket || "No ticket";
    }

    // =====================================
    // SHARED QUEUE
    // =====================================

    async function updateQueueDisplay(showErrors = false) {
        try {
            const data = await fetchJSON(API_URL);

            // Now serving
            setText(
                nowServingNum,
                data.now_serving
                    ? formatTicket(data.now_serving.ticket)
                    : "No ticket"
            );

            // Preparing / Next
            if (preparingList) {
                preparingList.replaceChildren();

                // Show tickets being prepared first, followed by waiting tickets.
                const nextTickets = [
                    ...(data.preparing || []),
                    ...(data.waiting || [])
                ].slice(0, 3);

                if (nextTickets.length === 0) {
                    const emptyItem = document.createElement("span");
                    emptyItem.textContent = "No tickets";
                    preparingList.appendChild(emptyItem);
                } else {
                    nextTickets.forEach(function (ticket) {
                        const ticketItem = document.createElement("span");
                        ticketItem.textContent = formatTicket(ticket.ticket);
                        preparingList.appendChild(ticketItem);
                    });
                }
            }

            // The logged-in student's active ticket
            setText(
                userTicketNum,
                data.my_ticket
                    ? formatTicket(data.my_ticket.ticket)
                    : "No ticket"
            );

            return data;
        } catch (error) {
            console.error("Unable to refresh Accounting queue:", error);

            if (showErrors && preparingList) {
                preparingList.replaceChildren();

                const errorItem = document.createElement("span");
                errorItem.textContent = "Unable to load queue";
                preparingList.appendChild(errorItem);
            }

            return null;
        }
    }

    // =====================================
    // ACCOUNTING LEDGER
    // =====================================

    function displayRequests() {
        if (!accountingLedgerBody) {
            return;
        }

        // Queue tickets are not financial transactions.
        // The ledger will be connected to actual transaction records separately.
        accountingLedgerBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.style.textAlign = "center";
        cell.style.padding = "20px";
        cell.textContent = "No accounting transactions available yet.";

        row.appendChild(cell);
        accountingLedgerBody.appendChild(row);
    }

    // =====================================
    // REQUEST ACCOUNTING TICKET
    // =====================================

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async function () {
            if (isRequestingTicket) {
                return;
            }

            isRequestingTicket = true;
            checkoutBtn.disabled = true;

            const originalText = checkoutBtn.textContent;
            checkoutBtn.textContent = "Requesting ticket...";

            try {
                const result = await fetchJSON(API_URL, {
                    method: "POST"
                });

                await updateQueueDisplay();

                alert(
                    result.message ||
                    `Your Accounting queue ticket is ${result.ticket}.`
                );
            } catch (error) {
                console.error("Unable to request Accounting ticket:", error);

                if (!error.message.includes("session has expired")) {
                    alert(error.message || "Unable to request a ticket.");
                }
            } finally {
                isRequestingTicket = false;
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = originalText;
            }
        });
    }

    // =====================================
    // DOWNLOAD SOA
    // =====================================

    if (downloadSoaBtn) {
        downloadSoaBtn.addEventListener("click", function () {
            const studentIdentifier =
                studentInfo?.username ||
                studentInfo?.full_name ||
                `Student-${studentInfo?.id || "Account"}`;

            const soaText = `
QUEUESKI
ACCOUNTING
STATEMENT OF ACCOUNT

Student:
${studentIdentifier}

Total Balance Due:
₱ 15,450.00

Last Payment Posted:
₱ 5,000.00

Generated:
${new Date().toLocaleString()}

NOTICE:
This is a sample SOA copy. The displayed financial
figures have not yet been connected to actual
accounting transaction records.
            `.trim();

            const blob = new Blob(
                [soaText],
                { type: "text/plain;charset=utf-8" }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "SOA-copy.txt";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        });
    }

    // =====================================
    // LOGOUT
    // =====================================

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();

            // The PHP session must be cleared by the server.
            // We'll connect this button to the project's logout endpoint
            // once its existing implementation is confirmed.
            window.location.href = "login.html";
        });
    }

    // =====================================
    // INITIALIZE
    // =====================================

    async function initializePage() {
        try {
            // Verify the PHP session instead of relying on localStorage.
            const session = await fetchJSON(SESSION_URL);
            studentInfo = session.user;

            displayRequests();

            await updateQueueDisplay(true);

            // Keep the shared queue refreshed while the page is open.
            refreshTimer = window.setInterval(function () {
                updateQueueDisplay();
            }, 5000);
        } catch (error) {
            console.error("Unable to initialize Accounting page:", error);

            if (!error.message.includes("session has expired")) {
                setText(nowServingNum, "Unavailable");
                setText(userTicketNum, "Unavailable");
            }
        }
    }

    initializePage();

    // Stop polling if the page is closed or navigated away from.
    window.addEventListener("pagehide", function () {
        if (refreshTimer !== null) {
            window.clearInterval(refreshTimer);
        }
    });
});