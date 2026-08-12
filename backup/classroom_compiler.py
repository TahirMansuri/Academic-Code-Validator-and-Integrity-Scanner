#!/usr/bin/env python3
import os
import sys
import html
import io
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import List, Dict, Any, Tuple
import getpass

# Google API libraries
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

# Scopes required to read courses, assignments, student submissions, download files.
SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.profile.emails',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

def authenticate_google():
    """Authenticate the user and return service objects for Classroom and Drive APIs."""
    creds = None
    token_path = Path("token.json")
    creds_path = Path("credentials.json")

    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not creds_path.exists():
                print("Error: 'credentials.json' not found. Please download it from Google Cloud Console and place it in this directory.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        token_path.write_text(creds.to_json())

    classroom_service = build('classroom', 'v1', credentials=creds)
    drive_service = build('drive', 'v3', credentials=creds)
    return classroom_service, drive_service

def list_courses(classroom):
    """Retrieve list of active courses."""
    results = classroom.courses().list(courseStates='ACTIVE').execute()
    return results.get('courses', [])

def list_coursework(classroom, course_id):
    """Retrieve coursework (assignments) for a course."""
    results = classroom.courses().courseWork().list(courseId=course_id).execute()
    return results.get('courseWork', [])

def get_student_profile(classroom, course_id, student_id) -> Tuple[str, str]:
    """Fetch student full name and email address."""
    try:
        student = classroom.courses().students().get(courseId=course_id, userId=student_id).execute()
        profile = student.get('profile', {})
        name = profile.get('name', {}).get('fullName', 'Unknown Name')
        email = profile.get('emailAddress', 'Unknown Email')
        return name, email
    except Exception:
        return 'Unknown Name', 'Unknown Email'

def download_file(drive_service, file_id, destination_path: Path):
    """Download a file from Google Drive."""
    request = drive_service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        status, done = downloader.next_chunk()
    destination_path.write_bytes(fh.getvalue())

def compile_source(source_code: str, filename: str) -> Tuple[bool, str]:
    """Attempt to compile python source code."""
    try:
        compile(source_code, filename, "exec")
        return True, ""
    except (SyntaxError, IndentationError) as e:
        msg = f"{e.__class__.__name__}: {e.msg} (line {e.lineno})"
        if e.text:
            msg += f"\n    {e.text.strip()}"
        return False, msg
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"

def post_classroom_comment(classroom, course_id, coursework_id, submission_id, message):
    """Log the comment locally since Google Classroom API does not support writing private comments."""
    print(f"-> [Feedback Logged Locally] Submission {submission_id} failed compilation. Feedback message ready.")

def send_email_notification(sender_email, sender_password, receiver_email, subject, body_text):
    """Send an email notification using Gmail SMTP server."""
    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_text, 'plain'))
        
        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print(f"-> Auto-Email successfully sent to student {receiver_email}")
    except Exception as email_err:
        print(f"Failed to send email to student {receiver_email}: {email_err}")

def main():
    classroom, drive = authenticate_google()

    # Step 1: Select Course
    courses = list_courses(classroom)
    if not courses:
        print("No active courses found.")
        return
    print("\n--- Active Courses ---")
    for i, course in enumerate(courses):
        print(f"[{i}] {course['name']}")
    
    course_idx = int(input("\nSelect a course by number: "))
    course = courses[course_idx]
    course_id = course['id']

    # Step 2: Select Assignment
    courseworks = list_coursework(classroom, course_id)
    if not courseworks:
        print("No coursework assignments found in this course.")
        return
    print("\n--- Assignments ---")
    for i, cw in enumerate(courseworks):
        print(f"[{i}] {cw['title']}")
    
    cw_idx = int(input("\nSelect an assignment by number: "))
    coursework = courseworks[cw_idx]
    coursework_id = coursework['id']

    # Step 2.5: Ask for Email Credentials to send notifications
    print("\n--- Email Setup (Gmail Server) ---")
    sender_email = "imrdcollegeshahada202627@gmail.com"
    sender_password = "ksgwtjzxpsjsftea"
    print(f"Using default sender: {sender_email}")

    # Step 3: Fetch Submissions
    print("\nFetching student submissions...")
    submissions_result = classroom.courses().courseWork().studentSubmissions().list(
        courseId=course_id, courseWorkId=coursework_id
    ).execute()
    submissions = submissions_result.get('studentSubmissions', [])

    if not submissions:
        print("No student submissions found.")
        return

    downloads_dir = Path("./classroom_submissions")
    downloads_dir.mkdir(exist_ok=True)

    results = []

    # Step 4: Process submissions
    for submission in submissions:
        # Check if they turned it in
        if submission.get('state') not in ['TURNED_IN', 'SUBMITTED']:
            continue

        student_id = submission['userId']
        submission_id = submission['id']
        student_name, student_email = get_student_profile(classroom, course_id, student_id)
        
        attachments = submission.get('assignmentSubmission', {}).get('attachments', [])
        for attachment in attachments:
            drive_file = attachment.get('driveFile')
            if drive_file:
                file_id = drive_file['id']
                file_title = drive_file['title']
                
                # Check if it is a python file
                if file_title.endswith('.py'):
                    dest_file = downloads_dir / f"{student_email.split('@')[0]}_{file_title}"
                    print(f"Downloading {file_title} from student {student_name} ({student_email})...")
                    
                    try:
                        download_file(drive, file_id, dest_file)
                        source_code = dest_file.read_text(encoding="utf-8", errors="ignore")
                        
                        # Compile
                        success, error_msg = compile_source(source_code, file_title)
                        mail_sent = "N/A (Success)"
                        
                        if not success:
                            # Step 5: Log locally
                            feedback_msg = (
                                f"Auto-Grading Notice:\n"
                                f"Your submitted file '{file_title}' failed compilation. "
                                f"Please review the error details, resolve the syntax/indentation issues, "
                                f"and resubmit your assignment.\n\n"
                                f"Compilation Error:\n{error_msg}"
                            )
                            post_classroom_comment(classroom, course_id, coursework_id, submission_id, feedback_msg)
                            
                            # Step 5b: Send email if credentials were provided
                            if sender_email and sender_password and student_email and student_email != 'Unknown Email':
                                email_subj = f"Classroom Auto-Grading: Python Compilation Failed for {file_title}"
                                try:
                                    send_email_notification(sender_email, sender_password, student_email, email_subj, feedback_msg)
                                    mail_sent = "Sent Successfully"
                                except Exception as e_send:
                                    mail_sent = f"Failed to Send: {e_send}"
                            else:
                                mail_sent = "No Credentials Configured"

                        results.append({
                            'student_name': student_name,
                            'student_email': student_email,
                            'file': file_title,
                            'success': success,
                            'error': error_msg,
                            'mail_sent': mail_sent
                        })

                    except Exception as e:
                        print(f"Error processing {file_title} for student {student_name}: {e}")

    # Step 6: Generate HTML Report
    generate_html_report(results)

def generate_html_report(results: List[Dict[str, Any]]):
    html_lines = [
        "<!DOCTYPE html>",
        "<html lang='en'>",
        "<head>",
        "  <meta charset='UTF-8'>",
        "  <title>Classroom Compilation Report</title>",
        "  <style>",
        "    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f6fa; color: #2f3640; }",
        "    h1 { color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }",
        "    .filter-container { margin-bottom: 20px; }",
        "    .filter-btn { padding: 10px 15px; margin-right: 5px; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; }",
        "    .btn-all { background-color: #747d8c; color: white; }",
        "    .btn-success { background-color: #2ed573; color: white; }",
        "    .btn-failed { background-color: #ff4757; color: white; }",
        "    .filter-btn:hover { opacity: 0.9; }",
        "    table { border-collapse: collapse; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background-color: #fff; }",
        "    th, td { border: 1px solid #dcdde1; padding: 12px 15px; text-align: left; }",
        "    th { background-color: #2c3e50; color: white; }",
        "    tr:nth-child(even) { background-color: #f8f9fa; }",
        "    .success { color: #2ed573; font-weight: bold; }",
        "    .failure { color: #ff4757; font-weight: bold; }",
        "    .mail-success { color: #2f3542; font-style: italic; }",
        "    .mail-failure { color: #ea2027; font-weight: bold; }",
        "    pre { background-color: #ffe0e6; padding: 10px; border-left: 5px solid #ff4757; margin: 0; overflow-x: auto; font-family: monospace; }",
        "  </style>",
        "</head>",
        "<body>",
        "  <h1>Google Classroom Auto-Compilation Report</h1>",
        "  <div class='filter-container'>",
        "    <button class='filter-btn btn-all' onclick='filterResults(\"all\")'>Show All</button>",
        "    <button class='filter-btn btn-success' onclick='filterResults(\"success\")'>Show Success Only</button>",
        "    <button class='filter-btn btn-failed' onclick='filterResults(\"failed\")'>Show Errors Only</button>",
        "  </div>",
        "  <table>",
        "    <thead>",
        "      <tr><th>Student Name</th><th>Student Email</th><th>File Name</th><th>Status</th><th>Notification Status</th><th>Error Description</th></tr>",
        "    </thead>",
        "    <tbody id='report-body'>"
    ]

    for r in results:
        status_class = "success" if r['success'] else "failure"
        status_text = "Success" if r['success'] else "Failed"
        row_status_type = "success" if r['success'] else "failed"
        
        # Color code the email sending status
        mail_status = r['mail_sent']
        if "Successfully" in mail_status:
            mail_class = "success"
        elif "Failed" in mail_status:
            mail_class = "mail-failure"
        else:
            mail_class = "mail-success"
            
        err_block = f"<pre>{html.escape(r['error'])}</pre>" if r['error'] else ""
        html_lines.append(
            f"      <tr data-status='{row_status_type}'>"
            f"        <td>{html.escape(r['student_name'])}</td>"
            f"        <td>{html.escape(r['student_email'])}</td>"
            f"        <td>{html.escape(r['file'])}</td>"
            f"        <td class='{status_class}'>{status_text}</td>"
            f"        <td class='{mail_class}'>{html.escape(mail_status)}</td>"
            f"        <td>{err_block}</td>"
            f"      </tr>"
        )

    html_lines.extend([
        "    </tbody>",
        "  </table>",
        "  <script>",
        "    function filterResults(type) {",
        "      const rows = document.querySelectorAll('#report-body tr');",
        "      rows.forEach(row => {",
        "        const status = row.getAttribute('data-status');",
        "        if (type === 'all' || status === type) {",
        "          row.style.display = '';",
        "        } else {",
        "          row.style.display = 'none';",
        "        }",
        "      });",
        "    }",
        "  </script>",
        "</body>",
        "</html>"
    ])

    report_path = Path("classroom_compilation_report.html")
    report_path.write_text("\n".join(html_lines), encoding="utf-8")
    print(f"\nFinal compilation report saved to {report_path.resolve()}")

if __name__ == "__main__":
    main()
