#!/usr/bin/env python3
"""compile_report.py

Scans the current directory (or a specified directory) for Python (.py) files,
attempts to compile each file to check for syntax and indentation errors, and
generates an HTML report listing each file, its status (Success/Failed), and any
error messages.

Usage:
    python compile_report.py [directory]
If no directory is provided, the script scans the directory it resides in.
"""

import os
import sys
import html
from pathlib import Path
from typing import List, Tuple

def compile_file(file_path: Path) -> Tuple[bool, str]:
    """Attempt to compile a Python file.

    Returns a tuple of (success, error_message). On success, error_message is an
    empty string. On failure, the error_message contains the exception text.
    """
    try:
        source = file_path.read_text(encoding="utf-8")
        compile(source, str(file_path), "exec")
        return True, ""
    except (SyntaxError, IndentationError) as e:
        msg = f"{e.__class__.__name__}: {e.msg} (line {e.lineno})"
        if e.text:
            msg += f"\n    {e.text.strip()}"
        return False, msg
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"

def find_python_files(root: Path) -> List[Path]:
    """Recursively collect all *.py files under *root*.
    """
    # Exclude compile_report.py itself to avoid self-reporting
    return [p for p in root.rglob("*.py") if p.is_file() and p.name != "compile_report.py"]

def generate_html_report(results: List[Tuple[Path, bool, str]], output_path: Path) -> None:
    """Write an HTML file summarising the compilation results.
    """
    html_lines = []
    html_lines.append("<!DOCTYPE html>")
    html_lines.append("<html lang='en'>")
    html_lines.append("<head>")
    html_lines.append("  <meta charset='UTF-8'>")
    html_lines.append("  <title>Python Compilation Report</title>")
    html_lines.append("  <style>")
    html_lines.append("    body { font-family: Arial, sans-serif; margin: 20px; background-color: #fcfcfc; color: #333; }")
    html_lines.append("    h1 { color: #2c3e50; }")
    html_lines.append("    table { border-collapse: collapse; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }")
    html_lines.append("    th, td { border: 1px solid #ddd; padding: 12px 15px; text-align: left; }")
    html_lines.append("    th { background-color: #34495e; color: white; font-weight: bold; }")
    html_lines.append("    tr:nth-child(even) { background-color: #f9f9f9; }")
    html_lines.append("    .success { color: #27ae60; font-weight: bold; }")
    html_lines.append("    .failure { color: #c0392b; font-weight: bold; }")
    html_lines.append("    pre { background-color: #fcedec; padding: 10px; border-left: 4px solid #c0392b; margin: 0; overflow-x: auto; font-family: Consolas, monospace; font-size: 0.9em; }")
    html_lines.append("  </style>")
    html_lines.append("</head>")
    html_lines.append("<body>")
    html_lines.append("  <h1>Python Compilation Report</h1>")
    html_lines.append("  <table>")
    html_lines.append("    <tr><th>File</th><th>Status</th><th>Error Details</th></tr>")
    
    for file_path, success, error in results:
        status_class = "success" if success else "failure"
        status_text = "Success" if success else "Failed"
        error_html = ""
        if error:
            error_html = f"<pre>{html.escape(error)}</pre>"
        
        # Display relative path for clean UI if possible
        try:
            display_path = file_path.relative_to(output_path.parent)
        except ValueError:
            display_path = file_path
            
        html_lines.append(
            f"    <tr><td>{html.escape(str(display_path))}</td><td class='{status_class}'>{status_text}</td><td>{error_html}</td></tr>"
        )
    html_lines.append("  </table>")
    html_lines.append("</body>")
    html_lines.append("</html>")
    
    output_path.write_text("\n".join(html_lines), encoding="utf-8")
    print(f"Report successfully written to {output_path}")

def main() -> None:
    if len(sys.argv) > 1:
        target_dir = Path(sys.argv[1]).resolve()
    else:
        target_dir = Path(__file__).parent.resolve()
    if not target_dir.is_dir():
        print(f"Error: {target_dir} is not a directory.")
        sys.exit(1)

    py_files = find_python_files(target_dir)
    results: List[Tuple[Path, bool, str]] = []
    for py_file in py_files:
        success, error_msg = compile_file(py_file)
        results.append((py_file, success, error_msg))

    report_path = target_dir / "compilation_report.html"
    generate_html_report(results, report_path)

if __name__ == "__main__":
    main()
