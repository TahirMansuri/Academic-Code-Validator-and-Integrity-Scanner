# Walkthrough Guide: Google Classroom Compiler

This walkthrough guides you through the workflow of using this tool for automated code verification and grading feedback.

## 1. Initial State: Starting the Script
Run the script using the virtual environment:
```bash
./.venv/bin/python classroom_compiler.py
```
You will be prompted to select a Course and an Assignment:
```text
--- Active Courses ---
[0] CA-212 Python Programming

Select a course by number: 0

--- Assignments ---
[0] Assignment 3: Control Flow – For Loop, While Loop & Number Logic
[1] Assignment 1: Basic Input, Output & Type Casting
[2] Assignment 2: Control Flow (if-else, Nested if, ladder, and match-case)

Select an assignment by number: 2
```

## 2. Processing State: Downloads, Compiles, and Emails
The script accesses the API, downloads files, runs local syntax checks, and automatically emails students whose work fails:
```text
Fetching student submissions...
Downloading HemantNikum_Assignment_6.py from student Hemant Nikum (hemantsen1006@gmail.com)...
-> [Feedback Logged Locally] Submission Cg4I_MXri7MXEKvcj-euGQ failed compilation. Feedback message ready.
-> Auto-Email successfully sent to student hemantsen1006@gmail.com
Downloading HemantNikum_Assignment_1.py from student Hemant Nikum (hemantsen1006@gmail.com)...
...
Final compilation report saved to /Users/tahirmansuri/Downloads/Assignment1_SYBCA_Python/classroom_compilation_report.html
```

## 3. Student Notification Email (Example Received by Student)
If a student's file fails to compile (e.g. `HemantNikum_Assignment_6.py`), they will receive an email like this:
```text
Subject: Classroom Auto-Grading: Python Compilation Failed for HemantNikum_Assignment_6.py

Auto-Grading Notice:
Your submitted file 'HemantNikum_Assignment_6.py' failed compilation. Please review the error details, resolve the syntax/indentation issues, and resubmit your assignment.

Compilation Error:
IndentationError: unindent does not match any outer indentation level (line 4)
```

## 4. Final Output: Interactive HTML Report
Once processing is complete, open `classroom_compilation_report.html` in your web browser. 

- **Show All**: View all submissions.
- **Show Errors Only**: Instantly filters the view to show only failed submissions, email status, and exact syntax/indentation traceback blocks. This serves as your quick checklist for grading.
