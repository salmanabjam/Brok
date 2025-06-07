# File: push_to_github.py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Project Migration Script - Enhanced Version
Author: BRAINix TradeX 2 Team
"""

import os
import subprocess
import sys
import requests
import json
from pathlib import Path
from urllib.parse import quote
import time

# Direct configuration (hardcoded values)
PROJECT_DIR = r"C:\Ai\Projects\BRAINixIDEX\BRAINix TradeX 2\BRAINix TradeX 2"
GITHUB_USERNAME = "salmanabjam"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # پیشنهاد می‌شود از متغیر محیطی استفاده کنید
REPO_NAME = "Brok"
BRANCH = "main"

# Allow override in Replit or env
PROJECT_DIR = os.getenv("PROJECT_DIR", PROJECT_DIR)
os.chdir(PROJECT_DIR)

class Colors:
    """Console colors for better output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_status(message, status="info"):
    """Print message with appropriate color"""
    icons = {
        "success": "✅",
        "error": "❌",
        "warning": "⚠️",
        "info": "ℹ️",
        "progress": "🔄"
    }
    icon = icons.get(status, icons["info"])
    color = getattr(Colors, status.upper(), Colors.BLUE)
    print(f"{color}{icon} {message}{Colors.END}")

def validate_environment():
    """Validate environment variables and project dir"""
    print_status("Checking environment variables...", "progress")
    missing = []
    for var in ["PROJECT_DIR", "GITHUB_USERNAME", "GITHUB_TOKEN", "REPO_NAME"]:
        if not globals().get(var):
            missing.append(var)
    if missing:
        print_status(f"Missing configuration: {', '.join(missing)}", "error")
        return False

    if not os.path.isdir(PROJECT_DIR):
        print_status(f"Project directory not found: {PROJECT_DIR}", "error")
        return False

    print_status("All environment variables are valid", "success")
    return True

def test_github_connectivity():
    """Test GitHub connection and repo access"""
    print_status("Testing GitHub connectivity...", "progress")
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}

    # 1) Test user access
    resp = requests.get("https://api.github.com/user", headers=headers, timeout=10)
    if resp.status_code == 401:
        print_status("GitHub token is invalid (401)", "error")
        return False
    if resp.status_code != 200:
        print_status(f"GitHub API error: {resp.status_code}", "error")
        return False
    user = resp.json().get("login")
    print_status(f"Connected as GitHub user: {user}", "success")

    # 2) Test repo access
    repo_api = f"https://api.github.com/repos/{GITHUB_USERNAME}/{REPO_NAME}"
    resp2 = requests.get(repo_api, headers=headers, timeout=10)
    if resp2.status_code == 404:
        print_status(f"Repository {REPO_NAME} not found (404)", "warning")
        return False
    if resp2.status_code != 200:
        print_status(f"Repository access error: {resp2.status_code}", "error")
        return False

    print_status(f"Repository {REPO_NAME} access confirmed", "success")
    return True

def run_cmd(cmd, cwd=None):
    """Run shell command and print its output"""
    try:
        print_status(f"Executing: {cmd}", "progress")
        res = subprocess.run(
            cmd, shell=True, cwd=cwd or PROJECT_DIR,
            capture_output=True, text=True, check=True
        )
        if res.stdout:
            print(f"   📝 {res.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print_status(f"Error running `{cmd}`", "error")
        print_status(e.stderr.strip() or str(e), "error")
        return False

def setup_git():
    """Initialize git repo and branch if needed"""
    git_dir = os.path.join(PROJECT_DIR, ".git")
    if not os.path.isdir(git_dir):
        if not run_cmd("git init"):
            return False
        if not run_cmd(f"git checkout -b {BRANCH}"):
            return False
    print_status("Git repository initialized", "success")
    return True

def setup_remote():
    """Configure remote origin with token in URL"""
    print_status("Setting up remote origin...", "progress")
    token_enc = quote(GITHUB_TOKEN)
    url = f"https://{GITHUB_USERNAME}:{token_enc}@github.com/{GITHUB_USERNAME}/{REPO_NAME}.git"
    # add or update origin
    origin_list = subprocess.getoutput(f'cd "{PROJECT_DIR}" && git remote')
    if "origin" in origin_list:
        run_cmd(f'git remote set-url origin {url}')
        print_status("Updated existing remote origin", "success")
    else:
        run_cmd(f'git remote add origin {url}')
        print_status("Added new remote origin", "success")
    return True

def commit_and_push():
    """Stage, commit, and push all changes"""
    if not run_cmd("git add ."):
        return False
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    if not run_cmd(f'git commit -m "Auto-commit: updates at {timestamp}"'):
        print_status("Nothing to commit (or commit failed)", "info")
    if not run_cmd(f"git push -u origin {BRANCH}"):
        return False
    print_status("All changes pushed successfully! 🎉", "success")
    return True

def main():
    print(f"{Colors.CYAN}{Colors.BOLD}\n🚀 GitHub Migration Script\n{Colors.END}")
    if not validate_environment(): sys.exit(1)
    if not test_github_connectivity(): sys.exit(1)
    if not setup_git(): sys.exit(1)
    if not setup_remote(): sys.exit(1)
    if not commit_and_push(): sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_status("Operation cancelled by user", "warning")
        sys.exit(0)
    except Exception as e:
        print_status(f"Unexpected error: {e}", "error")
        sys.exit(1)
