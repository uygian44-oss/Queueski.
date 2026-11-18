
document.addEventListener('DOMContentLoaded', function () {
    const nowServingNum = document.getElementById('nowServingNum');
    const preparingList = document.getElementById('preparingList');
    const userTicketNum = document.getElementById('userTicketNum');

    const requestForm = document.getElementById('documentRequestForm');
    const docTypeSelect = document.getElementById('docTypeSelect');
    const docQtyInput = document.getElementById('docQtyInput');
    const docPurposeInput = document.getElementById('docPurposeInput');
    const registrarLogsBody = document.getElementById('registrarLogsBody');

    let registrarRequests = [];

    // Keep the existing theme setting.
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function (event) {
            event.preventDefault();
            document.body.classList.toggle('dark-mode');
            localStorage.setItem(
                'theme',
                document.body.classList.contains('dark-mode') ? 'dark' : 'light'
            );
        });
    }

    // Keep the existing settings menu.
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');

    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            settingsMenu.classList.toggle('show');
        });

        settingsMenu.addEventListener('click', function (event) {
            event.stopPropagation();
        });

        document.addEventListener('click', function () {
            settingsMenu.classList.remove('show');
        });
    }

    // Logout through the existing logout endpoint, if available.
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function (event) {
            event.preventDefault();

            try {
                await fetch('../api/logout.php', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
            } finally {
                localStorage.removeItem('studentNumber');
                window.location.href = 'login.html';
            }
        });
    }

    function showStatus(status) {
        const map = {
            'Pending': 'status-pending',
            'In Progress': 'status-progress',
            'Completed': 'status-completed',
            'Skipped': 'status-skipped',
            'Rejected': 'status-skipped',
            'Approved': 'status-completed'
        };

        return map[status] || '';
    }

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    async function loadRequests() {
        try {
            const response = await fetch('../api/registrar.php', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store'
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (response.status === 401) {
                    alert('Your session has expired. Please log in again.');
                    window.location.href = 'login.html';
                    return;
                }

                throw new Error(data.message || 'Unable to load requests.');
            }

            registrarRequests = data.requests || [];
            displayRequests();
            updateQueueDisplay();
        } catch (error) {
            console.error('Registrar load error:', error);
            if (registrarLogsBody) {
                registrarLogsBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center;padding:20px;">
                            Unable to load requests. Please refresh the page.
                        </td>
                    </tr>`;
            }
        }
    }

    function updateQueueDisplay() {
        // Requests are loaded from the database.
        const serving = registrarRequests.find(
            request => request.queue_status === 'serving'
        );

        if (nowServingNum) {
            nowServingNum.textContent = serving?.ticket || 'No ticket';
        }

        if (preparingList) {
            preparingList.innerHTML = '';

            const pending = registrarRequests.filter(
                request => request.queue_status === 'waiting'
            );

            if (!pending.length) {
                preparingList.textContent = 'No tickets';
            } else {
                pending.slice(0, 3).forEach(request => {
                    const item = document.createElement('span');
                    item.textContent = request.ticket || 'No ticket';
                    preparingList.appendChild(item);
                });
            }
        }

        if (userTicketNum) {
            const active = registrarRequests.find(
                request =>
                    request.queue_status === 'waiting' ||
                    request.queue_status === 'preparing' ||
                    request.queue_status === 'serving'
            );

            userTicketNum.textContent = active?.ticket || 'No ticket';
        }
    }

    function displayRequests() {
        if (!registrarLogsBody) return;

        registrarLogsBody.innerHTML = '';

        if (!registrarRequests.length) {
            registrarLogsBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;padding:20px;">
                        No requests yet.
                    </td>
                </tr>`;
            return;
        }

        registrarRequests.forEach(request => {
            const row = document.createElement('tr');
            const status = request.status || 'Pending';

            row.innerHTML = `
                <td>${escapeHTML(request.ticket || '—')}</td>
                <td>${escapeHTML(request.document)}</td>
                <td>${Number(request.quantity) || 1}</td>
                <td>${escapeHTML(request.purpose || '—')}</td>
                <td>
                    <span class="status-tag ${showStatus(status)}">
                        ${escapeHTML(status)}
                    </span>
                </td>
            `;

            registrarLogsBody.appendChild(row);
        });
    }

    if (requestForm) {
        requestForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const documentType = docTypeSelect.value;
            const quantity = Number(docQtyInput.value);
            const purpose = docPurposeInput.value.trim();

            if (!documentType || !purpose || !Number.isInteger(quantity) ||
                quantity < 1 || quantity > 5) {
                alert('Please check the document type, quantity, and purpose.');
                return;
            }

            const submitButton = requestForm.querySelector(
                'button[type="submit"]'
            );

            if (submitButton) submitButton.disabled = true;

            try {
                const response = await fetch('../api/registrar.php', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document: documentType,
                        quantity: quantity,
                        purpose: purpose
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    if (response.status === 401) {
                        alert('Please log in again before submitting a request.');
                        window.location.href = 'login.html';
                        return;
                    }

                    alert(data.message || 'Unable to submit your request.');
                    return;
                }

                alert(`Your ticket number is ${data.ticket}.`);

                requestForm.reset();
                docQtyInput.value = '1';

                await loadRequests();
            } catch (error) {
                console.error('Registrar submission error:', error);
                alert('Could not contact the server. Please try again.');
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    loadRequests();
});
