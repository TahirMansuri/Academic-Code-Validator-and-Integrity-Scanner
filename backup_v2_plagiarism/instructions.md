# Instructions Manual: Setup & Execution

Follow these steps to configure, install, and run the Google Classroom Compiler and Notifier.

## 1. Setup Virtual Environment & Install Dependencies
First, make sure python is installed on your machine. Install requirements inside your virtual environment (`.venv`):

```bash
# Install dependencies
./.venv/bin/pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

## 2. Google Cloud Platform (GCP) Credentials Setup
If you need to reconfigure or create new client credentials:
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Classroom API** and the **Google Drive API** in your project.
3. Configure the **OAuth Consent Screen**:
   - Choose **Internal** user type if using school Workspace emails, or **External**.
   - If using **External** user type, add your test email `imrdcollegeshahada202627@gmail.com` under the **Test Users** section.
4. Create an **OAuth Client ID** credential of type **Desktop App**.
5. Download the JSON credential file, rename it to `credentials.json`, and place it in the root folder of this project.

## 3. Run the Program
To run the Classroom syncing, compiling, and automated emailing utility:

```bash
./.venv/bin/python classroom_compiler.py
```

### Steps during Execution:
1. **Authorize**: On first run, a browser tab will open requesting permissions. Sign in with your grading account and allow permissions. (A local file named `token.json` will be saved so this step is skipped next time).
2. **Select Course**: The terminal will list all active courses. Type the number corresponding to your course and hit Enter.
3. **Select Assignment**: Choose the coursework assignment by entering its list index number.
4. **Compile & Notify**: The script will automatically process student attachments, download them locally into `classroom_submissions/`, test compile them, send warning emails on syntax failures, and write the report.

## 4. View Report
Open `classroom_compilation_report.html` in any web browser to view, filter, and inspect grading status.
