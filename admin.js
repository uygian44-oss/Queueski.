
document.addEventListener("DOMContentLoaded", function () {
    // =====================================
    //             ELEMENTS
    // =====================================

    const navItems = document.querySelectorAll(".nav-item");
    const searchInput = document.getElementById("searchInput");
    const tableBody = document.getElementById("requestsTableBody");
    const countersContainer = document.getElementById("countersContainer");
    const addCounterBtn = document.getElementById("addCounterBtn");

    const studentsView = document.getElementById("studentsView");
    const studentDetailsView = document.getElementById("studentDetailsView");
    const studentDetailsContent = document.getElementById("studentDetailsContent");
    const backToStudentsBtn = document.getElementById("backToStudentsBtn");

    const studentSearch = document.getElementById("studentSearch");
    const studentsTableBody = document.getElementById("studentsTableBody");
    const gradeFilter = document.getElementById("gradeFilter");
    const sectionFilter = document.getElementById("sectionFilter");

    // Student account create/edit modal
    const addStudentBtn = document.getElementById("addStudentBtn");
    const studentAccountModal = document.getElementById("studentAccountModal");
    const studentAccountForm = document.getElementById("studentAccountForm");
    const studentAccountMode = document.getElementById("studentAccountMode");
    const studentAccountModalTitle = document.getElementById("studentAccountModalTitle");
    const studentAccountModalDescription = document.getElementById("studentAccountModalDescription");
    const studentAccountMessage = document.getElementById("studentAccountMessage");
    const accountStudentId = document.getElementById("accountStudentId");
    const accountFirstName = document.getElementById("accountFirstName");
    const accountMiddleName = document.getElementById("accountMiddleName");
    const accountLastName = document.getElementById("accountLastName");
    const accountEmail = document.getElementById("accountEmail");
    const accountGradeLevel = document.getElementById("accountGradeLevel");
    const accountSection = document.getElementById("accountSection");
    const accountPassword = document.getElementById("accountPassword");
    const accountPasswordHelp = document.getElementById("accountPasswordHelp");
    const accountPasswordRequired = document.getElementById("accountPasswordRequired");
    const saveStudentAccountBtn = document.getElementById("saveStudentAccountBtn");
    const closeStudentAccountModalBtn = document.getElementById("closeStudentAccountModalBtn");
    const cancelStudentAccountBtn = document.getElementById("cancelStudentAccountBtn");

    const logoutBtn = document.getElementById("logoutBtn");
    const logoutModal = document.getElementById("logoutModal");
    const cancelLogout = document.getElementById("cancelLogout");
    const confirmLogout = document.getElementById("confirmLogout");

    const counterTitle = document.getElementById("counterTitle");
    const tableTitle = document.getElementById("tableTitle");
    const activeQueueCount = document.getElementById("activeQueueCount");

    const API_URL = "../api/admin.php";
    const STUDENTS_API_URL = "../api/admin_students.php";
    const STUDENT_DETAILS_API_URL = "../api/admin_student_details.php";
    const STUDENT_MANAGE_API_URL = "../api/admin_student_details.php";

    let currentStudentId = null;
    let currentView = "overview";
    let tickets = [];
    let students = [];
    let currentAdmin = null;
    let loadingTickets = false;
    let loadingStudents = false;
    let studentsLoaded = false;

    // =====================================
    //              THEME
    // =====================================

    function applyTheme(theme) {
        const selectedTheme = theme === "dark" ? "dark" : "light";

        document.body.classList.toggle(
            "dark-mode",
            selectedTheme === "dark"
        );

        localStorage.setItem("theme", selectedTheme);
    }

    applyTheme(localStorage.getItem("theme"));

    document.addEventListener("click", function (event) {
        const target = event.target;

        if (!(target instanceof Element)) return;

        if (target.closest("#themeToggle")) {
            event.preventDefault();

            applyTheme(
                document.body.classList.contains("dark-mode")
                    ? "light"
                    : "dark"
            );

            return;
        }

        if (target.closest("#settingsLogoutBtn")) {
            event.preventDefault();

            if (logoutModal) {
                logoutModal.classList.add("active");
            }
        }
    });

    // =====================================
    //          ACCOUNT SETTINGS
    // =====================================

    document.addEventListener(
        "queueski:setting-selected",
        function (event) {
            const detail = event.detail || {};

            if (
                detail.setting === "account" &&
                detail.isAdmin === true
            ) {
                window.location.href = "account-settings.html";
            }
        }
    );

    // =====================================
    //        SAFE TABLE CELL HELPER
    // =====================================

    function addCell(row, value, className) {
        const cell = document.createElement("td");
        cell.textContent = value ?? "";

        if (className) {
            cell.className = className;
        }

        row.appendChild(cell);
        return cell;
    }

    // =====================================
    //          TABLE MESSAGE HELPER
    // =====================================

    function showTableMessage(table, message, columnCount) {
        if (!table) return;

        table.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = columnCount;
        cell.textContent = message;
        cell.style.textAlign = "center";
        cell.style.padding = "20px";

        row.appendChild(cell);
        table.appendChild(row);
    }

    // =====================================
    //          TICKET HELPERS
    // =====================================

    function statusClass(status) {
        if (status === "In Progress") return "status-progress";
        if (status === "Completed") return "status-completed";
        if (status === "Skipped") return "status-skipped";

        return "status-pending";
    }

    function actionText(ticket) {
        if (ticket.status === "In Progress") return "Complete";

        if (
            ticket.status === "Completed" ||
            ticket.status === "Skipped"
        ) {
            return "View";
        }

        return "Process";
    }

    function visibleTickets() {
        return tickets.filter(function (ticket) {
            return currentView === "overview" ||
                ticket.department === currentView;
        });
    }

    function isMyActiveTicket(ticket) {
        return Boolean(
            currentAdmin &&
            ticket.assignedAdminId &&
            String(ticket.assignedAdminId) === String(currentAdmin.id) &&
            ticket.status === "In Progress"
        );
    }

    function myActiveTicket() {
        return tickets.find(isMyActiveTicket) || null;
    }

    function isWaiting(ticket) {
        return ticket.status === "Pending" ||
            ticket.status === "Waiting";
    }

    // =====================================
    //          LOAD QUEUE TICKETS
    // =====================================

    async function loadTickets() {
        if (loadingTickets) return;

        loadingTickets = true;

        try {
            const response = await fetch(API_URL, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load tickets."
                );
            }

            tickets = Array.isArray(data.tickets)
                ? data.tickets
                : [];

            if (
                data.admin &&
                data.admin.id &&
                Number(data.admin.counterNumber) > 0
            ) {
                currentAdmin = {
                    id: String(data.admin.id),
                    counterNumber: Number(data.admin.counterNumber)
                };
            } else {
                currentAdmin = null;
            }

            renderDashboard();

        } catch (error) {
            console.error("Admin queue loading failed:", error);

            showTableMessage(
                tableBody,
                "Unable to load tickets. Please refresh or log in again.",
                6
            );

        } finally {
            loadingTickets = false;
        }
    }

    // =====================================
    //          DASHBOARD METRICS
    // =====================================

    function updateMetrics() {
        const pending = tickets.filter(isWaiting);

        if (activeQueueCount) {
            activeQueueCount.textContent = pending.length;
        }

        document.querySelectorAll(".metric-card.filter-card").forEach(
            function (card) {
                const value = card.querySelector(".value");

                if (!value) return;

                const department = card.dataset.dept;

                const count = pending.filter(
                    ticket => ticket.department === department
                ).length;

                if (
                    department === "accounting" ||
                    department === "registrar"
                ) {
                    value.textContent = count + " Pending";
                }
            }
        );
    }

    // =====================================
    //          RENDER REQUEST TABLE
    // =====================================

    function renderTable() {
        if (!tableBody) return;

        tableBody.innerHTML = "";

        const filtered = visibleTickets();

        const query = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        const searched = filtered.filter(function (ticket) {
            return [
                ticket.studentNumber,
                ticket.studentName,
                ticket.department,
                ticket.document,
                ticket.description,
                ticket.status,
                ticket.ticket
            ].some(value =>
                String(value ?? "").toLowerCase().includes(query)
            );
        });

        if (searched.length === 0) {
            showTableMessage(tableBody, "No requests found.", 6);
            return;
        }

        searched.forEach(function (ticket) {
            const row = document.createElement("tr");

            row.dataset.ticketId = ticket.id;
            row.dataset.dept = ticket.department;

            addCell(row, ticket.studentNumber, "student-cell");

            addCell(
                row,
                ticket.department === "accounting"
                    ? "Accounting"
                    : "Registrar"
            );

            const details = document.createElement("td");
            details.textContent = ticket.document || "Request";

            if (
                ticket.quantity !== undefined &&
                ticket.department === "registrar"
            ) {
                const small = document.createElement("small");

                small.textContent = "Quantity: " + ticket.quantity;
                small.style.display = "block";
                small.style.color = "var(--text-muted)";

                details.appendChild(small);
            }

            row.appendChild(details);

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");

            badge.className =
                "status-tag " + statusClass(ticket.status);
            badge.textContent = ticket.status;

            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            addCell(row, ticket.ticket);

            const actionCell = document.createElement("td");
            actionCell.style.textAlign = "right";

            const button = document.createElement("button");

            button.className =
                "btn " +
                (
                    ticket.status === "Completed" ||
                    ticket.status === "Skipped"
                        ? "btn-secondary"
                        : "btn-primary"
                ) +
                " btn-sm action-btn";

            button.textContent = actionText(ticket);

            button.disabled =
                ticket.status === "Completed" ||
                ticket.status === "Skipped";

            actionCell.appendChild(button);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });
    }

    // =====================================
    //          RENDER SHARED COUNTER
    // =====================================

    function renderCounters() {
        if (!countersContainer) return;

        const cards = Array.from(
            countersContainer.querySelectorAll(".counter-card")
        );

        // The dashboard uses one shared counter per logged-in admin.
        // Keep the first existing card and hide any old department card.
        cards.forEach(function (card, index) {
            card.style.display = index === 0 ? "" : "none";
        });

        const card = cards[0];

        if (!card) return;

        card.dataset.dept = "shared";

        const badge = card.querySelector(".badge");
        const number = card.querySelector(".num");
        const student = card.querySelector(".student-id span");
        const active = myActiveTicket();

        if (badge) {
            badge.textContent = currentAdmin
                ? "Counter " +
                    String(currentAdmin.counterNumber).padStart(2, "0") +
                    " — Shared Service"
                : "Counter assignment unavailable";
        }

        if (number) {
            number.textContent = active
                ? active.ticket
                : "No ticket";
        }

        if (student) {
            student.textContent = active
                ? active.studentNumber
                : "No ticket";
        }

        // Prevent the UI from displaying an active ticket belonging to
        // another admin. The API still enforces ownership server-side.
        const nextButton = card.querySelector(".next-btn");
        const skipButton = card.querySelector(".skip-btn");

        if (nextButton) {
            nextButton.disabled = !currentAdmin || Boolean(active);
        }

        if (skipButton) {
            skipButton.disabled = !active;
        }

        // Counter assignment is managed in the database, not in the browser.
        if (addCounterBtn) {
            addCounterBtn.style.display = "none";
        }
    }

    function renderDashboard() {
        renderCounters();
        updateMetrics();

        if (
            currentView !== "students" &&
            (!studentDetailsView ||
                studentDetailsView.style.display === "none")
        ) {
            renderTable();
        }
    }

    // =====================================
    //          STUDENT FILTER HELPERS
    // =====================================

    function getGradeValue(student) {
        const grade = student.Grade_Level;

        if (
            grade === null ||
            grade === undefined ||
            String(grade).trim() === ""
        ) {
            return "";
        }

        return String(grade).trim();
    }

    function getSectionValue(student) {
        const section = student.Section;

        if (
            section === null ||
            section === undefined ||
            String(section).trim() === ""
        ) {
            return "";
        }

        return String(section).trim();
    }

    function getGradeLabel(student) {
        const grade = getGradeValue(student);
        return grade ? "Grade " + grade : "Not Assigned";
    }

    function getSectionLabel(student) {
        return getSectionValue(student) || "Not Assigned";
    }

    function updateSectionOptions() {
        if (!sectionFilter) return;

        const selectedGrade = gradeFilter
            ? gradeFilter.value
            : "";

        const previousSection = sectionFilter.value;

        const availableStudents = students.filter(function (student) {
            if (!selectedGrade) return true;

            if (selectedGrade === "unassigned") {
                return getGradeValue(student) === "";
            }

            return getGradeValue(student) === selectedGrade;
        });

        const sections = [
            ...new Set(
                availableStudents
                    .map(getSectionValue)
                    .filter(section => section !== "")
            )
        ].sort(function (a, b) {
            return a.localeCompare(b, undefined, {
                numeric: true,
                sensitivity: "base"
            });
        });

        sectionFilter.innerHTML = "";

        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "All Sections";
        sectionFilter.appendChild(allOption);

        sections.forEach(function (section) {
            const option = document.createElement("option");
            option.value = section;
            option.textContent = "Section " + section;
            sectionFilter.appendChild(option);
        });

        const unassignedOption = document.createElement("option");
        unassignedOption.value = "unassigned";
        unassignedOption.textContent = "Not Assigned";
        sectionFilter.appendChild(unassignedOption);

        const canKeepPrevious = Array.from(sectionFilter.options).some(
            option => option.value === previousSection
        );

        sectionFilter.value = canKeepPrevious ? previousSection : "";
    }

    // =====================================
    //          LOAD STUDENTS
    // =====================================

    async function loadStudents() {
        if (!studentsTableBody || loadingStudents) return;

        loadingStudents = true;

        showTableMessage(
            studentsTableBody,
            "Loading student records...",
            6
        );

        try {
            const response = await fetch(STUDENTS_API_URL, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load students."
                );
            }

            students = Array.isArray(data.students)
                ? data.students
                : [];

            studentsLoaded = true;

            updateSectionOptions();
            renderStudents();

        } catch (error) {
            console.error("Student loading failed:", error);

            showTableMessage(
                studentsTableBody,
                "Unable to load student records. Please refresh or log in again.",
                6
            );

        } finally {
            loadingStudents = false;
        }
    }

    // =====================================
    //          RENDER STUDENTS
    // =====================================

    function renderStudents() {
        if (!studentsTableBody) return;

        const query = studentSearch
            ? studentSearch.value.trim().toLowerCase()
            : "";

        const selectedGrade = gradeFilter
            ? gradeFilter.value
            : "";

        const selectedSection = sectionFilter
            ? sectionFilter.value
            : "";

        const filteredStudents = students.filter(function (student) {
            const grade = getGradeValue(student);
            const section = getSectionValue(student);

            if (selectedGrade === "unassigned") {
                if (grade !== "") return false;
            } else if (
                selectedGrade !== "" &&
                grade !== selectedGrade
            ) {
                return false;
            }

            if (selectedSection === "unassigned") {
                if (section !== "") return false;
            } else if (
                selectedSection !== "" &&
                section !== selectedSection
            ) {
                return false;
            }

            return [
                student.Student_ID,
                student.Full_Name,
                student.Email
            ].some(value =>
                String(value ?? "").toLowerCase().includes(query)
            );
        });

        studentsTableBody.innerHTML = "";

        if (filteredStudents.length === 0) {
            showTableMessage(
                studentsTableBody,
                "No student records found for the selected filters.",
                6
            );
            return;
        }

        filteredStudents.forEach(function (student) {
            const row = document.createElement("tr");

            const studentIdCell = document.createElement("td");
            studentIdCell.className = "student-cell";

            const studentIdButton = document.createElement("button");
            studentIdButton.type = "button";
            studentIdButton.className = "student-id-link";
            studentIdButton.textContent = student.Student_ID ?? "";
            studentIdButton.dataset.studentId = student.Student_ID ?? "";
            studentIdButton.setAttribute(
                "aria-label",
                "View details for student " +
                    (student.Student_ID ?? "")
            );

            studentIdCell.appendChild(studentIdButton);
            row.appendChild(studentIdCell);

            addCell(row, student.Full_Name);
            addCell(row, getGradeLabel(student));
            addCell(row, getSectionLabel(student));
            addCell(row, student.Email || "No email registered");

            const createdAt = student.Created_At
                ? new Date(
                    student.Created_At.replace(" ", "T")
                ).toLocaleDateString()
                : "—";

            addCell(row, createdAt);

            studentsTableBody.appendChild(row);
        });
    }

    // =====================================
    //          STUDENT DETAILS HELPERS
    // =====================================

    function createDetailElement(tag, value, className) {
        const element = document.createElement(tag);

        element.textContent =
            value === null ||
            value === undefined ||
            String(value).trim() === ""
                ? "—"
                : String(value);

        if (className) {
            element.className = className;
        }

        return element;
    }

    function formatDetailDate(value) {
        if (!value) return "—";

        const date = new Date(String(value).replace(" ", "T"));

        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleDateString();
    }

    function renderStudentDetails(data) {
        if (!studentDetailsContent) return;

        const student = data.student || {};
        const enrollment = data.current_enrollment || null;
        const enrollments = Array.isArray(data.enrollments)
            ? data.enrollments
            : [];

        studentDetailsContent.innerHTML = "";

        studentDetailsContent.appendChild(
            createDetailElement("h3", "Account Information")
        );

        const accountTable = document.createElement("table");
        accountTable.className = "data-table";

        const accountBody = document.createElement("tbody");

        const accountFields = [
            ["Student ID", student.Student_ID],
            ["Full Name", student.Full_Name],
            ["First Name", student.First_Name],
            ["Middle Name", student.Middle_Name],
            ["Last Name", student.Last_Name],
            ["Email Address", student.Email],
            [
                "Grade Level",
                student.Grade_Level !== null &&
                student.Grade_Level !== undefined &&
                String(student.Grade_Level).trim() !== ""
                    ? "Grade " + student.Grade_Level
                    : "Not Assigned"
            ],
            ["Section", student.Section || "Not Assigned"],
            ["Account Created", formatDetailDate(student.Created_At)]
        ];

        accountFields.forEach(function ([label, value]) {
            const row = document.createElement("tr");

            row.append(
                createDetailElement("th", label),
                createDetailElement("td", value)
            );

            accountBody.appendChild(row);
        });

        accountTable.appendChild(accountBody);
        studentDetailsContent.appendChild(accountTable);

        // Edit account button
        const accountActions = document.createElement("div");
        accountActions.className = "student-account-actions";
        accountActions.style.marginTop = "16px";

        const editAccountButton = document.createElement("button");
        editAccountButton.type = "button";
        editAccountButton.className = "btn btn-primary";
        editAccountButton.textContent = "Edit Student Account";
        editAccountButton.addEventListener("click", function () {
            openStudentAccountModal("edit", student);
        });

        accountActions.appendChild(editAccountButton);
        studentDetailsContent.appendChild(accountActions);

        const currentHeading = createDetailElement(
            "h3",
            "Current Enrollment"
        );

        currentHeading.style.marginTop = "24px";
        studentDetailsContent.appendChild(currentHeading);

        if (enrollment) {
            const currentTable = document.createElement("table");
            currentTable.className = "data-table";

            const currentBody = document.createElement("tbody");

            [
                ["Grade Level", enrollment.grade_level],
                ["School Year", enrollment.school_year],
                ["Semester", enrollment.term],
                ["Section", enrollment.section],
                ["Strand", enrollment.strand]
            ].forEach(function ([label, value]) {
                const row = document.createElement("tr");

                row.append(
                    createDetailElement("th", label),
                    createDetailElement("td", value)
                );

                currentBody.appendChild(row);
            });

            currentTable.appendChild(currentBody);
            studentDetailsContent.appendChild(currentTable);
        } else {
            studentDetailsContent.appendChild(
                createDetailElement(
                    "p",
                    "No enrollment record is available for this student."
                )
            );
        }

        const historyHeading = createDetailElement(
            "h3",
            "Enrollment History"
        );

        historyHeading.style.marginTop = "24px";
        studentDetailsContent.appendChild(historyHeading);

        const historyTable = document.createElement("table");
        historyTable.className = "data-table";

        const historyHead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        [
            "Grade Level",
            "School Year",
            "Semester",
            "Section",
            "Strand",
            "Recorded On"
        ].forEach(function (label) {
            headerRow.appendChild(
                createDetailElement("th", label)
            );
        });

        historyHead.appendChild(headerRow);
        historyTable.appendChild(historyHead);

        const historyBody = document.createElement("tbody");

        if (enrollments.length === 0) {
            const row = document.createElement("tr");
            const cell = createDetailElement(
                "td",
                "No enrollment history found."
            );

            cell.colSpan = 6;
            cell.style.textAlign = "center";

            row.appendChild(cell);
            historyBody.appendChild(row);
        } else {
            enrollments.forEach(function (item) {
                const row = document.createElement("tr");

                [
                    item.grade_level,
                    item.school_year,
                    item.term,
                    item.section,
                    item.strand,
                    formatDetailDate(item.created_at)
                ].forEach(function (value) {
                    row.appendChild(
                        createDetailElement("td", value)
                    );
                });

                historyBody.appendChild(row);
            });
        }

        historyTable.appendChild(historyBody);
        studentDetailsContent.appendChild(historyTable);
    }

    // =====================================
    //          OPEN STUDENT DETAILS
    // =====================================

    async function openStudentDetails(studentId) {
        currentStudentId = String(studentId || "");

        if (
            !studentDetailsView ||
            !studentDetailsContent ||
            !studentsView
        ) {
            console.error(
                "Student Details elements are missing from admin.html."
            );
            return;
        }

        currentView = "students";

        studentsView.style.display = "none";
        studentDetailsView.style.display = "";

        document.querySelectorAll(
            ".content-area > section:not(#studentDetailsView)"
        ).forEach(function (section) {
            section.style.display = "none";
        });

        if (searchInput) {
            searchInput.style.display = "none";
        }

        navItems.forEach(function (item) {
            item.classList.toggle(
                "active",
                item.dataset.view === "students"
            );
        });

        studentDetailsContent.innerHTML = "";

        studentDetailsContent.appendChild(
            createDetailElement("p", "Loading student details...")
        );

        try {
            const url = new URL(
                STUDENT_DETAILS_API_URL,
                window.location.href
            );

            url.searchParams.set("student_id", studentId);

            const response = await fetch(url.toString(), {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load student details."
                );
            }

            renderStudentDetails(data);

        } catch (error) {
            console.error("Student details loading failed:", error);

            studentDetailsContent.innerHTML = "";

            studentDetailsContent.appendChild(
                createDetailElement(
                    "p",
                    error.message ||
                        "Unable to load student details. Please try again."
                )
            );
        }
    }

    // =====================================
    //       STUDENT ACCOUNT MODAL
    // =====================================

    function setStudentAccountMessage(message, type) {
        if (!studentAccountMessage) return;

        studentAccountMessage.textContent = message || "";
        studentAccountMessage.className = "account-form-message";

        if (type) {
            studentAccountMessage.classList.add(type);
        }

        studentAccountMessage.style.display = message ? "block" : "none";
    }

    function closeStudentAccountModal() {
        if (!studentAccountModal) return;

        studentAccountModal.classList.remove("active");
        studentAccountModal.setAttribute("aria-hidden", "true");

        if (studentAccountForm) {
            studentAccountForm.reset();
        }

        setStudentAccountMessage("", "");

        if (saveStudentAccountBtn) {
            saveStudentAccountBtn.disabled = false;
            saveStudentAccountBtn.textContent = "Create Account";
        }
    }

    function openStudentAccountModal(mode, student) {
        if (!studentAccountModal || !studentAccountForm) {
            console.error("Student account modal is missing from admin.html.");
            return;
        }

        const isEdit = mode === "edit";
        const record = student || {};

        studentAccountForm.reset();
        setStudentAccountMessage("", "");

        if (studentAccountMode) {
            studentAccountMode.value = isEdit ? "update" : "create";
        }

        if (studentAccountModalTitle) {
            studentAccountModalTitle.textContent = isEdit
                ? "Edit Student Account"
                : "Add Student Account";
        }

        if (studentAccountModalDescription) {
            studentAccountModalDescription.textContent = isEdit
                ? "Update the student's account information. Leave the password blank to keep the current password."
                : "Enter the student's information to create an account.";
        }

        if (accountStudentId) {
            accountStudentId.value = record.Student_ID || "";
            accountStudentId.readOnly = isEdit;
            accountStudentId.required = true;
        }

        if (accountFirstName) accountFirstName.value = record.First_Name || "";
        if (accountMiddleName) accountMiddleName.value = record.Middle_Name || "";
        if (accountLastName) accountLastName.value = record.Last_Name || "";
        if (accountEmail) accountEmail.value = record.Email || "";

        if (accountGradeLevel) {
            accountGradeLevel.value =
                record.Grade_Level === null ||
                record.Grade_Level === undefined
                    ? ""
                    : String(record.Grade_Level);
        }

        if (accountSection) {
            accountSection.value = record.Section || "";
        }

        if (accountPassword) {
            accountPassword.value = "";
            accountPassword.required = !isEdit;
            accountPassword.placeholder = isEdit
                ? "Leave blank to keep current password"
                : "Enter initial password";
        }

        if (accountPasswordHelp) {
            accountPasswordHelp.textContent = isEdit
                ? "Leave this blank if you do not want to change the current password."
                : "Set the initial password for this student account (at least 8 characters).";
        }

        if (accountPasswordRequired) {
            accountPasswordRequired.style.display = isEdit ? "none" : "inline";
        }

        if (saveStudentAccountBtn) {
            saveStudentAccountBtn.disabled = false;
            saveStudentAccountBtn.textContent = isEdit
                ? "Save Changes"
                : "Create Account";
        }

        studentAccountModal.classList.add("active");
        studentAccountModal.setAttribute("aria-hidden", "false");

        window.setTimeout(function () {
            if (isEdit && accountFirstName) {
                accountFirstName.focus();
            } else if (accountStudentId) {
                accountStudentId.focus();
            }
        }, 0);
    }

    async function saveStudentAccount(event) {
        event.preventDefault();

        if (!studentAccountForm || !saveStudentAccountBtn) return;

        const action = studentAccountMode
            ? studentAccountMode.value
            : "create";

        const password = accountPassword
            ? accountPassword.value
            : "";

        if (action === "create" && !password.trim()) {
            setStudentAccountMessage(
                "Please enter an initial password.",
                "error"
            );

            if (accountPassword) accountPassword.focus();
            return;
        }

        if (password && password.length < 8) {
            setStudentAccountMessage(
                "Password must be at least 8 characters long.",
                "error"
            );

            if (accountPassword) accountPassword.focus();
            return;
        }

        const payload = {
            action: action,
            student_id: accountStudentId
                ? accountStudentId.value.trim()
                : "",
            first_name: accountFirstName
                ? accountFirstName.value.trim()
                : "",
            middle_name: accountMiddleName
                ? accountMiddleName.value.trim()
                : "",
            last_name: accountLastName
                ? accountLastName.value.trim()
                : "",
            email: accountEmail
                ? accountEmail.value.trim()
                : "",
            grade_level: accountGradeLevel
                ? accountGradeLevel.value
                : "",
            section: accountSection
                ? accountSection.value.trim()
                : "",
            password: password
        };

        saveStudentAccountBtn.disabled = true;
        saveStudentAccountBtn.textContent = action === "update"
            ? "Saving..."
            : "Creating...";

        setStudentAccountMessage(
            "Please wait while the account is being saved...",
            "info"
        );

        try {
            const response = await fetch(STUDENT_MANAGE_API_URL, {
                method: "POST",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to save the student account."
                );
            }

            const savedStudentId = payload.student_id;

            closeStudentAccountModal();

            studentsLoaded = false;
            await loadStudents();

            if (action === "update") {
                await openStudentDetails(savedStudentId);
            } else {
                filterView("students");

                if (studentSearch) {
                    studentSearch.value = savedStudentId;
                    renderStudents();
                }

                alert(
                    data.message ||
                    "Student account created successfully."
                );
            }

        } catch (error) {
            console.error("Student account save failed:", error);

            setStudentAccountMessage(
                error.message ||
                    "Unable to save the student account. Please try again.",
                "error"
            );

        } finally {
            if (
                saveStudentAccountBtn &&
                studentAccountModal &&
                studentAccountModal.classList.contains("active")
            ) {
                saveStudentAccountBtn.disabled = false;

                saveStudentAccountBtn.textContent = action === "update"
                    ? "Save Changes"
                    : "Create Account";
            }
        }
    }

    // Add Student button
    if (addStudentBtn) {
        addStudentBtn.addEventListener("click", function () {
            openStudentAccountModal("create");
        });
    }

    // Student account form submission
    if (studentAccountForm) {
        studentAccountForm.addEventListener(
            "submit",
            saveStudentAccount
        );
    }

    // Close and cancel buttons
    [
        closeStudentAccountModalBtn,
        cancelStudentAccountBtn
    ].forEach(function (button) {
        if (button) {
            button.addEventListener(
                "click",
                closeStudentAccountModal
            );
        }
    });

    // Close modal when clicking outside the modal card
    if (studentAccountModal) {
        studentAccountModal.addEventListener("click", function (event) {
            if (event.target === studentAccountModal) {
                closeStudentAccountModal();
            }
        });
    }

    // Close modal using Escape key
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            studentAccountModal &&
            studentAccountModal.classList.contains("active")
        ) {
            closeStudentAccountModal();
        }
    });

    // =====================================
    //          STUDENT DETAILS EVENTS
    // =====================================

    if (studentsTableBody) {
        studentsTableBody.addEventListener("click", function (event) {
            const target = event.target;

            if (!(target instanceof Element)) return;

            const button = target.closest(".student-id-link");

            if (!button) return;

            const studentId = button.dataset.studentId;

            if (studentId) {
                openStudentDetails(studentId);
            }
        });
    }

    if (backToStudentsBtn) {
        backToStudentsBtn.addEventListener("click", function () {
            filterView("students");
        });
    }

    // =====================================
    //          SWITCH ADMIN VIEWS
    // =====================================

    function filterView(view) {
        const validViews = [
            "overview",
            "students",
            "accounting",
            "registrar"
        ];

        if (!validViews.includes(view)) {
            view = "overview";
        }

        currentView = view;

        const showingStudents = view === "students";

        if (studentDetailsView) {
            studentDetailsView.style.display = "none";
        }

        if (studentsView) {
            studentsView.style.display = showingStudents ? "" : "none";
        }

        document.querySelectorAll(
            ".content-area > section:not(#studentsView):not(#studentDetailsView)"
        ).forEach(function (section) {
            section.style.display = showingStudents ? "none" : "";
        });

        if (searchInput) {
            searchInput.style.display = showingStudents ? "none" : "";
        }

        if (!showingStudents) {
            if (counterTitle) {
                counterTitle.textContent = currentAdmin
                    ? "My Service Counter"
                    : "Service Counter";
            }

            if (tableTitle) {
                tableTitle.textContent =
                    view === "accounting"
                        ? "Accounting Requests"
                        : view === "registrar"
                            ? "Registrar / RIC Requests"
                            : "Pending Document & Transaction Requests";
            }

            // Keep the shared counter visible regardless of department.
            if (countersContainer) {
                countersContainer.querySelectorAll(
                    ".counter-card"
                ).forEach(function (card, index) {
                    card.style.display = index === 0 ? "" : "none";
                });
            }

            renderDashboard();

        } else if (!studentsLoaded) {
            loadStudents();

        } else {
            renderStudents();
        }

        navItems.forEach(function (item) {
            item.classList.toggle(
                "active",
                item.dataset.view === view
            );
        });
    }

    // =====================================
    //          UPDATE TICKETS
    // =====================================

    async function updateTicket(ticketId, action) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    ticket_id: Number(ticketId),
                    action: action
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Unable to update ticket.");

                await loadTickets();
                return false;
            }

            await loadTickets();
            return true;

        } catch (error) {
            console.error("Ticket update failed:", error);

            alert("Could not contact the server. Please try again.");
            return false;
        }
    }

    // =====================================
    //          SIDEBAR NAVIGATION
    // =====================================

    navItems.forEach(function (item) {
        item.addEventListener("click", function (event) {
            event.preventDefault();
            filterView(item.dataset.view || "overview");
        });
    });

    // =====================================
    //          SEARCH AND FILTER EVENTS
    // =====================================

    if (searchInput) {
        searchInput.addEventListener("input", renderTable);
    }

    if (studentSearch) {
        studentSearch.addEventListener("input", renderStudents);
    }

    if (gradeFilter) {
        gradeFilter.addEventListener("change", function () {
            updateSectionOptions();
            renderStudents();
        });
    }

    if (sectionFilter) {
        sectionFilter.addEventListener("change", renderStudents);
    }

    // =====================================
    //          REQUEST ACTIONS
    // =====================================

    if (tableBody) {
        tableBody.addEventListener("click", async function (event) {
            const target = event.target;

            if (!(target instanceof Element)) return;

            const button = target.closest(".action-btn");

            if (!button) return;

            const row = button.closest("tr");

            if (!row) return;

            const ticket = tickets.find(
                item => Number(item.id) === Number(row.dataset.ticketId)
            );

            if (!ticket) return;

            if (isWaiting(ticket)) {
                // Let the API enforce ticket ownership and active-ticket rules.
                await updateTicket(ticket.id, "start");

            } else if (ticket.status === "In Progress") {
                if (!isMyActiveTicket(ticket)) {
                    alert("This ticket is assigned to another admin.");
                    return;
                }

                await updateTicket(ticket.id, "complete");

            } else {
                alert(
                    "Ticket: " + ticket.ticket +
                    "\nStudent: " + ticket.studentNumber +
                    "\nStatus: " + ticket.status
                );
            }
        });
    }

    // =====================================
    //          SHARED COUNTER ACTIONS
    // =====================================

    if (countersContainer) {
        countersContainer.addEventListener("click", async function (event) {
            const target = event.target;

            if (!(target instanceof Element)) return;

            const card = target.closest(".counter-card");

            if (!card || card !== countersContainer.querySelector(".counter-card")) {
                return;
            }

            if (!currentAdmin) {
                alert(
                    "Your counter assignment could not be verified. Please refresh or log in again."
                );
                return;
            }

            if (target.closest(".next-btn")) {
                const active = myActiveTicket();

                if (active) {
                    alert(
                        "You are already serving " + active.ticket + "."
                    );
                    return;
                }

                const next = tickets.find(isWaiting);

                if (!next) {
                    alert("There are no waiting tickets.");
                    return;
                }

                if (await updateTicket(next.id, "start")) {
                    alert(
                        "Now serving " + next.ticket +
                        "\nDepartment: " +
                        (
                            next.department === "accounting"
                                ? "Accounting"
                                : "Registrar"
                        ) +
                        "\nStudent: " + next.studentNumber
                    );
                }
            }

            if (target.closest(".skip-btn")) {
                const active = myActiveTicket();

                if (!active) {
                    alert("You have no active ticket to skip.");
                    return;
                }

                if (confirm("Skip ticket " + active.ticket + "?")) {
                    await updateTicket(active.id, "skip");
                }
            }
        });
    }

    // =====================================
    //          DISABLE ADD COUNTER
    // =====================================

    if (addCounterBtn) {
        addCounterBtn.style.display = "none";
    }

    // =====================================
    //              LOGOUT
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
        confirmLogout.addEventListener("click", function () {
            localStorage.removeItem("userRole");
            window.location.href = "login.html";
        });
    }

    // =====================================
    //              INITIAL LOAD
    // =====================================

    filterView("overview");
    loadTickets();

    // Refresh queue data without replacing the Students view.
    window.setInterval(loadTickets, 10000);
});
