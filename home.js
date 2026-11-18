/* =========================================
   QUEUESKI - STUDENT HOME
========================================= */

document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    // ======================================
    //           ELEMENTS
    // ======================================

    const studentNumElement =
        document.getElementById("displayStudentNum");

    const btnAccounting =
        document.getElementById("btnAccounting");

    const btnRegistrar =
        document.getElementById("btnRegistrar");

    // ======================================
    //           HELPER FUNCTIONS
    // ======================================

    function showSessionError(message) {
        console.error("QUEUESKI session error:", message);

        alert(message);
    }

    // ======================================
    //           VERIFY STUDENT SESSION
    // ======================================

    try {
        const response = await fetch("../api/session.php", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            }
        });

        let result;

        try {
            result = await response.json();
        } catch (error) {
            console.error(
                "Invalid session response:",
                error
            );

            showSessionError(
                "The server returned an invalid session response. " +
                "Please check your PHP server."
            );

            return;
        }

        console.log("QUEUESKI session URL:", response.url);
        console.log("QUEUESKI session status:", response.status);
        console.log("QUEUESKI session response:", result);

        if (!response.ok || result.success !== true) {
            showSessionError(
                result.message ||
                "Your login session could not be verified. " +
                "Please log in again."
            );

            // Do not automatically redirect here.
            // Keep the page open so the error can be investigated.
            return;
        }

        // ======================================
        //           DISPLAY STUDENT DETAILS
        // ======================================

        const student = result.user || {};

        if (studentNumElement) {
            studentNumElement.textContent =
                student.student_id ||
                student.username ||
                student.full_name ||
                "Student";
        }

        console.log(
            "QUEUESKI student session verified."
        );

    } catch (error) {
        console.error(
            "Unable to verify QUEUESKI session:",
            error
        );

        showSessionError(
            "Unable to contact the server to verify your login. " +
            "Please make sure Apache and MySQL are running."
        );

        return;
    }

    // ======================================
    //           OPEN ACCOUNTING
    // ======================================

    if (btnAccounting) {
        btnAccounting.addEventListener("click", function () {
            window.location.href = "accounting.html";
        });
    }

    // ======================================
    //           OPEN REGISTRAR
    // ======================================

    if (btnRegistrar) {
        btnRegistrar.addEventListener("click", function () {
            window.location.href = "registrar.html";
        });
    }
});