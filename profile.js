// =====================================
// QUEUESKI STUDENT PROFILE
// =====================================

document.addEventListener("DOMContentLoaded", function () {
    loadStudentProfile();
});


// =====================================
// LOAD STUDENT PROFILE
// =====================================

async function loadStudentProfile() {
    const loadingMessage = document.getElementById("profileLoading");
    const errorMessage = document.getElementById("profileError");
    const profileContent = document.getElementById("profileContent");

    try {
        const response = await fetch("../api/student_profile.php", {
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
                data.message || "Unable to load your profile."
            );
        }

        displayPersonalInformation(data.student);
        displayCurrentEnrollment(data.current_enrollment);
        displayAcademicHistory(data.enrollments);

        profileContent.hidden = false;

    } catch (error) {
        console.error("Student profile error:", error);

        errorMessage.textContent =
            error.message || "Something went wrong while loading your profile.";

        errorMessage.hidden = false;

    } finally {
        loadingMessage.hidden = true;
    }
}


// =====================================
// DISPLAY PERSONAL INFORMATION
// =====================================

function displayPersonalInformation(student) {
    document.getElementById("profileStudentId").textContent =
        student.student_id || "—";

    document.getElementById("profileFullName").textContent =
        student.full_name || "—";

    document.getElementById("profileLastName").textContent =
        student.last_name || "—";

    document.getElementById("profileFirstName").textContent =
        student.first_name || "—";

    document.getElementById("profileMiddleName").textContent =
        student.middle_name || "—";
}


// =====================================
// DISPLAY CURRENT ENROLLMENT
// =====================================

function displayCurrentEnrollment(enrollment) {
    const container = document.getElementById("currentEnrollment");

    container.replaceChildren();

    if (!enrollment) {
        const message = document.createElement("p");

        message.className = "student-profile-empty";
        message.textContent = "No current enrollment record is available.";

        container.appendChild(message);
        return;
    }

    const enrollmentDetails = [
        {
            label: "Grade Level",
            value: enrollment.grade_level
        },
        {
            label: "School Year",
            value: enrollment.school_year
        },
        {
            label: "Semester",
            value: enrollment.term
        },
        {
            label: "Strand",
            value: enrollment.strand
        },
        {
            label: "Section",
            value: enrollment.section
        }
    ];

    enrollmentDetails.forEach(function (detail) {
        const item = document.createElement("div");
        item.className = "student-profile-info-item";

        const label = document.createElement("span");
        label.className = "student-profile-label";
        label.textContent = detail.label;

        const value = document.createElement("strong");
        value.textContent = detail.value || "—";

        item.appendChild(label);
        item.appendChild(value);

        container.appendChild(item);
    });
}


// =====================================
// DISPLAY ACADEMIC HISTORY
// =====================================

function displayAcademicHistory(enrollments) {
    const tableBody = document.getElementById("academicHistoryBody");
    const emptyMessage = document.getElementById("academicHistoryEmpty");

    tableBody.replaceChildren();

    if (!Array.isArray(enrollments) || enrollments.length === 0) {
        emptyMessage.hidden = false;
        return;
    }

    emptyMessage.hidden = true;

    enrollments.forEach(function (enrollment) {
        const row = document.createElement("tr");

        const values = [
            enrollment.school_year,
            enrollment.grade_level,
            enrollment.term,
            enrollment.strand,
            enrollment.section
        ];

        values.forEach(function (value) {
            const cell = document.createElement("td");

            cell.textContent = value || "—";
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}
