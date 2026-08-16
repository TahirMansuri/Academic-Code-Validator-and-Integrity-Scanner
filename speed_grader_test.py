#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from typing import Tuple

# Google API libraries
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.profile.emails',
    'https://www.googleapis.com/auth/classroom.rosters.readonly'
]

def authenticate_google():
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
                print("Error: 'credentials.json' not found.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
            creds = flow.run_local_server(port=0)
        token_path.write_text(creds.to_json())

    classroom_service = build('classroom', 'v1', credentials=creds)
    return classroom_service

def list_courses(classroom):
    results = classroom.courses().list(courseStates='ACTIVE').execute()
    return results.get('courses', [])

def list_coursework(classroom, course_id):
    results = classroom.courses().courseWork().list(courseId=course_id).execute()
    return results.get('courseWork', [])

def get_student_profile(classroom, course_id, student_id) -> Tuple[str, str]:
    try:
        student = classroom.courses().students().get(courseId=course_id, userId=student_id).execute()
        profile = student.get('profile', {})
        name = profile.get('name', {}).get('fullName', 'Unknown Name')
        email = profile.get('emailAddress', 'Unknown Email')
        return name, email
    except Exception:
        return 'Unknown Name', 'Unknown Email'

def get_submission_time(submission):
    history = submission.get('submissionHistory', [])
    turned_in_times = []
    
    for event in history:
        state_history = event.get('stateHistory', {})
        if state_history.get('state') == 'TURNED_IN':
            timestamp = state_history.get('stateTimestamp')
            if timestamp:
                turned_in_times.append(timestamp)
                
    if turned_in_times:
        # Return the LATEST turn-in time in case they unsubmitted and resubmitted
        return sorted(turned_in_times)[-1]
    return None

def main():
    print("Authenticating with Google Classroom...")
    classroom_service = authenticate_google()
    
    courses = list_courses(classroom_service)
    if not courses:
        print("No active courses found.")
        return
        
    print("\n--- Available Courses ---")
    for i, course in enumerate(courses):
        print(f"{i + 1}. {course['name']}")
        
    c_idx = int(input("\nSelect course number: ")) - 1
    course_id = courses[c_idx]['id']
    
    courseworks = list_coursework(classroom_service, course_id)
    if not courseworks:
        print("No assignments found in this course.")
        return
        
    print("\n--- Available Assignments ---")
    for i, cw in enumerate(courseworks):
        print(f"{i + 1}. {cw['title']}")
        
    cw_idx = int(input("\nSelect assignment number: ")) - 1
    coursework_id = courseworks[cw_idx]['id']
    
    print("\nFetching submissions and determining submission times...")
    submissions = []
    page_token = None
    while True:
        response = classroom_service.courses().courseWork().studentSubmissions().list(
            courseId=course_id,
            courseWorkId=coursework_id,
            pageToken=page_token
        ).execute()
        submissions.extend(response.get('studentSubmissions', []))
        page_token = response.get('nextPageToken')
        if not page_token:
            break
            
    processed_subs = []
    for sub in submissions:
        student_id = sub['userId']

        has_py = False
        assignment_sub = sub.get("assignmentSubmission", {})
        attachments = assignment_sub.get("attachments", [])
        for attachment in attachments:
            drive_file = attachment.get("driveFile", {})
            title = drive_file.get("title", "")
            if title.endswith(".py"):
                has_py = True
                break
                
        if not has_py:
            continue
            
        turn_in_time = get_submission_time(sub)

        
        if turn_in_time:
            name, email = get_student_profile(classroom_service, course_id, student_id)
            processed_subs.append({
                'name': name,
                'email': email,
                'time': turn_in_time,
                'state': sub.get('state')
            })
            
    if not processed_subs:
        print("\nNo turned-in submissions found for this assignment.")
        return
        
    # Sort chronologically by submission time
    processed_subs.sort(key=lambda x: x['time'])
    
    print("\n" + "="*85)
    print(f"{'Rank':<5} | {'Student Name':<25} | {'Turned-In Time (UTC)':<30} | {'Auto-Grade':<10}")
    print("="*85)
    
    min_score = 50
    for i, p_sub in enumerate(processed_subs):
        if i < 5:
            score = 95
        else:
            # Drops by 5 for every student after the 5th
            score = max(min_score, 95 - ((i - 4) * 5))
            
        print(f"{i+1:<5} | {p_sub['name']:<25} | {p_sub['time']:<30} | {score:<10}")
        
    print("="*85)

if __name__ == "__main__":
    main()
