# Google Classroom Code Compiler & Auto-Notifier

An automated grading helper that integrates with the Google Classroom API to download student Python submissions, check them for syntax/indentation errors, send structured email notifications to students who submitted broken code, and render an interactive status report.

## Complete Functionality
1. **API Integration**: Authenticates securely via OAuth2, retrieves active courses, lists coursework assignments, and retrieves student submission states.
2. **Submissions Manager**: Downloads student-attached Python (`.py`) files to a local directory (`classroom_submissions`), systematically matching them to their owner.
3. **Syntax Validation**: Safely compiles downloaded code check blocks to isolate `SyntaxError` and `IndentationError` details.
4. **Email Notification Engine**: Connects to SMTP (Gmail) using secure credentials and sends detailed compiler warnings directly to student emails to encourage rapid fixes and resubmissions.
5. **Interactive Dashboard**: Generates a responsive HTML compilation report featuring:
   - Full student name and email.
   - Target submission filename and file test status (Success / Failed).
   - Email transmission status.
   - Exact syntax traceback with code snippets.
   - Interactive filtering buttons (All, Success, Failed/Errors) for quick grading.
