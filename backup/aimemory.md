# AI Memory Document

This file acts as a technical memory profile of the project state, details, and prompts. It allows you to feed this project context directly into any other LLM/AI model for immediate pair programming.

## Project Summary
We built a local python tool that links to Google Classroom APIs, downloads submitted student assignment python files, checks them for compiler/indentation errors using Python's AST compiler, sends emails to flagged students notifying them of syntax errors, and writes a neat, interactive HTML dashboard with buttons to filter records by status.

## Technical Details
- **Tech Stack**: Python 3.10+ (using `google-api-python-client`, `google-auth-oauthlib` libraries).
- **Core Files**:
  - `classroom_compiler.py`: Main classroom API sync script containing SMTP integration.
  - `compile_report.py`: Local scanning compiler utility (scans local directories).
  - `credentials.json`: OAuth Client ID configuration file downloaded from Google Cloud.
  - `token.json`: Saved user login authentication state token.
- **Google API Scopes used**:
  - `https://www.googleapis.com/auth/classroom.courses.readonly`
  - `https://www.googleapis.com/auth/classroom.coursework.students`
  - `https://www.googleapis.com/auth/classroom.profile.emails`
  - `https://www.googleapis.com/auth/classroom.rosters.readonly`
  - `https://www.googleapis.com/auth/drive.readonly`

## Prompts Used (Memory State)
1. *Initial check prompt*: "create python code which will pick files, test for compilation, if all compiled proper with proper indentation, then create html report showing filename and failed status with error."
2. *Classroom Integration*: "if i have google classroom, and i want to directly compile files from there, can we do like that? ... if files fail compilation, excuse them automatically (using Private comments -> modified to direct emails due to Classroom API limitations)."
3. *Email notification*: "send automated email to the student on failure ... use default email imrdcollegeshahada202627@gmail.com and save app password ksgwtjzxpsjsftea."
4. *Filtering Dashboard*: "add student names to HTML report, show Notification status column, and add filter buttons to view errors only."

## Future Technical Prompts
If you want to continue this project with another AI Model, paste the following prompt:
> "I have a Python-based Google Classroom auto-compiler. It authenticates with Google Classroom, downloads submissions, compiles them, emails students on failure, and outputs `classroom_compilation_report.html`. The source files are `classroom_compiler.py` and `credentials.json` are present in the directory. I want to add [Enhancement Idea, e.g., Auto-Grader / Plagiarism check]. Review the repository files and implement it."
