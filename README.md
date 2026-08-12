# Academic Code Validator and Integrity Scanner
An automated cloud grading assistant and code-integrity scanning application designed to integrate programmatically with Google Classroom APIs. This system validates student Python submissions, executes structural code plagiarism checks, emails debugging logs on errors, and renders an interactive local grading dashboard.

---

## Author & Project Info
- **Author**: **Tahir Husen Najir Mansuri**
- **Profile**: Lead System Engineer at *Optimas AI* | H.O.D. Asst. Prof. at *IMRD, Shahada*
- **Expertise**: Java Full Stack Developer with 9+ Years of Industry & Academic Experience
- **Repository**: [Academic-Code-Validator-and-Integrity-Scanner](https://github.com/TahirMansuri/Academic-Code-Validator-and-Integrity-Scanner)

---

## Core Functionality
1. **Google Classroom API Syncing**: Performs OAuth2 authentication to read courses, parse assignments, map rosters, and check submission states.
2. **Submissions Manager**: Downloads student python scripts directly into a clean directory (`classroom_submissions`) mapping files to student names.
3. **AST Syntax Validation**: Tests scripts for compilation using Python's AST compiler, isolating syntax tracebacks and indentation errors.
4. **Code Similarity (Plagiarism) Checker**: Runs pairwise code-alignment scans (using `difflib.SequenceMatcher`) on normalized student codes (commentless, spacing-independent) and flags similarities exceeding **80%**.
5. **Auto-Notification Loop**: Integrates Gmail SMTP server variables to send detailed debugging emails to students who submitted non-compiling scripts.
6. **Interactive Dashboard**: Outputs `classroom_compilation_report.html` tracking student submissions with status metrics and client-side filtering features.

---

## Technical Specifications
- **Runtime**: Python 3.10+
- **APIs**: Google Classroom API (v1), Google Drive API (v3), SMTP (tls/587)
- **Dependencies**: `google-api-python-client`, `google-auth-oauthlib`, `getpass`, `difflib`

