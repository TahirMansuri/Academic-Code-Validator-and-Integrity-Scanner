# Features Directory: Covered & Future Roadmap

This document outlines the capabilities currently supported by the system, as well as the proposed roadmap for future enhancements.

## Covered Features (Completed)
- [x] **Recursive Python Compiler & Syntax Tester**: Locally parses `.py` files and prints errors using python's built-in execution tools.
- [x] **Google Classroom Course & Assignment Selector**: Dynamically fetches active courses and homework listings via API.
- [x] **Submission File Downloader**: Safely accesses and downloads Python submission attachments.
- [x] **Auto-Email Notifications**: Connects to SMTP to mail code tracebacks to students on compilation failures.
- [x] **HTML Dashboard**: Generates structured reports documenting student details, file validation outputs, and email outcomes.
- [x] **Interactive UI Filters**: Implemented client-side filtering buttons (`All`, `Success`, `Errors Only`) to toggle visibility in the dashboard.
- [x] **Student Profiles Integration**: Fetches student names from Google profiles for report clarity.

## Future Feature Roadmap (Planned)
- [ ] **Functional Code Runner (Test Cases)**: Execute code using mock inputs to check logic output correctness.
- [ ] **Google Classroom Draft Grading**: Auto-assign grading feedback scores inside classroom coursework drafts.
- [ ] **Plagiarism Checker / Similarity Check**: Compare submissions side-by-side using text-similarity/diffing algorithms.
- [ ] **Code Quality & Formatting Linting**: Check styling (PEP 8 spacing, docstrings, variable naming) and display style diagnostics in the dashboard.
