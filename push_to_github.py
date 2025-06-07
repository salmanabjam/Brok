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
GITHUB_TOKEN = "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"
REPO_NAME = "hispax"
BRANCH = "main"

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
    colors = {
        "success": f"{Colors.GREEN}✅",
        "error": f"{Colors.RED}❌", 
        "warning": f"{Colors.YELLOW}⚠️",
        "info": f"{Colors.BLUE}ℹ️",
        "progress": f"{Colors.PURPLE}🔄"
    }
    color = colors.get(status, "ℹ️")
    print(f"{color} {message}{Colors.END}")

def validate_environment():
    """Validate environment variables"""
    print_status("Checking environment variables...", "progress")
    
    required_vars = {
        "PROJECT_DIR": PROJECT_DIR,
        "GITHUB_USERNAME": GITHUB_USERNAME, 
        "GITHUB_TOKEN": GITHUB_TOKEN,
        "REPO_NAME": REPO_NAME
    }
    
    missing_vars = [var for var, value in required_vars.items() if not value]
    
    if missing_vars:
        print_status(f"Missing environment variables: {', '.join(missing_vars)}", "error")
        print_status("Please check your .env file", "error")
        return False
    
    if not os.path.isdir(PROJECT_DIR):
        print_status(f"Project directory not found: {PROJECT_DIR}", "error")
        return False
        
    print_status("All environment variables are valid", "success")
    return True

def test_github_connectivity():
    """Test GitHub connection and access"""
    print_status("Testing GitHub connectivity...", "progress")
    
    try:
        # Test general access
        response = requests.get("https://api.github.com/user", 
                              headers={"Authorization": f"token {GITHUB_TOKEN}"},
                              timeout=10)
        
        if response.status_code == 401:
            print_status("GitHub token is invalid", "error")
            return False
        elif response.status_code != 200:
            print_status(f"GitHub connection error: {response.status_code}", "error")
            return False
            
        user_info = response.json()
        print_status(f"Successfully connected to GitHub - User: {user_info.get('login')}", "success")
        
        # Test repository access
        repo_url = f"https://api.github.com/repos/{GITHUB_USERNAME}/{REPO_NAME}"
        repo_response = requests.get(repo_url, 
                                   headers={"Authorization": f"token {GITHUB_TOKEN}"},
                                   timeout=10)
        
        if repo_response.status_code == 404:
            print_status(f"Repository {REPO_NAME} not found - Has it been created?", "warning")
            return create_repository()
        elif repo_response.status_code != 200:
            print_status(f"Repository access error: {repo_response.status_code}", "error")
            return False
            
        print_status(f"Repository {REPO_NAME} access confirmed", "success")
        return True
        
    except requests.exceptions.RequestException as e:
        print_status(f"Internet connection error: {e}", "error")
        return False

def create_repository():
    """Create repository if it doesn't exist"""
    print_status(f"Do you want to create repository {REPO_NAME}? (y/n): ", "info")
    
    choice = input().lower().strip()
    if choice not in ['y', 'yes']:
        print_status("Operation cancelled", "warning")
        return False
    
    print_status(f"Creating repository {REPO_NAME}...", "progress")
    
    try:
        create_data = {
            "name": REPO_NAME,
            "description": "BRAINix TradeX 2 - Automated Trading System",
            "private": False,
            "auto_init": False
        }
        
        response = requests.post("https://api.github.com/user/repos",
                               headers={"Authorization": f"token {GITHUB_TOKEN}"},
                               json=create_data,
                               timeout=15)
        
        if response.status_code == 201:
            print_status(f"Repository {REPO_NAME} created successfully", "success")
            return True
        elif response.status_code == 403:
            print_status("❌ Access Error: Your GitHub token doesn't have permission to create repositories", "error")
            print_status("🔧 Solution:", "info")
            print("   1. Go to GitHub Settings → Developer settings → Personal access tokens")
            print("   2. Enable 'repo' scope for your token")
            print("   3. Or manually create the repository on GitHub")
            print(f"   4. URL: https://github.com/new")
            print_status("Have you manually created the repository and want to continue? (y/n): ", "info")
            manual_choice = input().lower().strip()
            return manual_choice in ['y', 'yes']
        else:
            print_status(f"Repository creation error: {response.status_code} - {response.text}", "error")
            return False
            
    except requests.exceptions.RequestException as e:
        print_status(f"Repository creation error: {e}", "error")
        return False

def run_command(cmd, cwd=None):
    """Execute command with better output"""
    try:
        print_status(f"Executing: {cmd}", "progress")
        result = subprocess.run(cmd, shell=True, check=True, cwd=cwd or PROJECT_DIR,
                              capture_output=True, text=True, encoding='utf-8')
        if result.stdout.strip():
            print(f"   📝 {result.stdout.strip()}")
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip() if e.stderr else str(e)
        print_status(f"Command execution error: {cmd}", "error")
        print_status(f"Error details: {error_msg}", "error")
        return False, error_msg

def git_command(cmd):
    """Execute git command"""
    return run_command(f'git {cmd}', PROJECT_DIR)

def create_comprehensive_gitignore():
    """Create comprehensive .gitignore"""
    gitignore_path = os.path.join(PROJECT_DIR, ".gitignore")
    
    gitignore_content = """# System files and folders
.DS_Store
Thumbs.db
desktop.ini

# Visual Studio / Visual Studio Code
.vs/
.vscode/
*.suo
*.user
*.userosscache
*.sln.docstates
*.vcxproj.filters
*.vcxproj.user

# Build and output folders
[Bb]in/
[Oo]bj/
[Dd]ebug/
[Rr]elease/
x64/
x86/
build/
dist/
out/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/
*.egg-info/
.pytest_cache/

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Sensitive files
.env
.env.local
.env.production
*.key
*.pem
config/secrets.*
secrets/

# Temporary files
*.tmp
*.temp
*.log
*.bak
*.swp
*.swo
*~

# IDE
*.iml
.idea/
*.ipr
*.iws

# OS generated files
.DS_Store?
ehthumbs.db
Icon?

# Project specific files
New Text Document.txt
"""

    try:
        with open(gitignore_path, "w", encoding="utf-8") as f:
            f.write(gitignore_content)
        print_status("Comprehensive .gitignore created", "success")
        return True
    except Exception as e:
        print_status(f".gitignore creation error: {e}", "error")
        return False

def check_git_status():
    """Check git status"""
    success, output = git_command("status --porcelain")
    if not success:
        return False, []
    
    changes = output.strip().split('\n') if output.strip() else []
    return True, changes

def initialize_git_repo():
    """Initialize git repository"""
    git_dir = os.path.join(PROJECT_DIR, ".git")
    
    if not os.path.isdir(git_dir):
        print_status("Initializing Git repository...", "progress")
        success, _ = git_command("init")
        if not success:
            return False
        
        # Set main branch
        success, _ = git_command(f"checkout -b {BRANCH}")
        if not success:
            print_status(f"Error creating branch {BRANCH}", "error")
            return False
    
    print_status("Git repository is ready", "success")
    return True

def setup_remote():
    """Setup remote origin"""
    print_status("Setting up remote origin...", "progress")
    
    # Create secure URL
    encoded_token = quote(GITHUB_TOKEN)
    remote_url = f"https://{GITHUB_USERNAME}:{encoded_token}@github.com/{GITHUB_USERNAME}/{REPO_NAME}.git"
    
    # Check existing remote
    success, output = git_command("remote")
    
    if "origin" in output:
        success, _ = git_command(f"remote set-url origin {remote_url}")
        print_status("Remote origin updated", "success")
    else:
        success, _ = git_command(f"remote add origin {remote_url}")
        print_status("Remote origin added", "success")
    
    return success

def commit_and_push():
    """Perform commit and push"""
    # Check for changes
    success, changes = check_git_status()
    if not success:
        return False
    
    if not changes:
        print_status("No changes to commit", "info")
        return True
    
    print_status(f"Number of changed files: {len(changes)}", "info")
    
    # Add files
    print_status("Adding files to Git...", "progress")
    success, _ = git_command("add .")
    if not success:
        return False
    
    # Commit
    commit_message = f"Auto-commit: {len(changes)} files updated - {time.strftime('%Y-%m-%d %H:%M:%S')}"
    print_status("Performing commit...", "progress")
    success, _ = git_command(f'commit -m "{commit_message}"')
    if not success:
        return False
    
    # Push
    print_status(f"Pushing to branch {BRANCH}...", "progress")
    success, _ = git_command(f"push -u origin {BRANCH}")
    if not success:
        return False
    
    print_status("All files successfully transferred to GitHub! 🎉", "success")
    return True

def show_project_summary():
    """Display project summary"""
    print_status("Project Summary:", "info")
    print(f"  📁 Project Path: {PROJECT_DIR}")
    print(f"  👤 GitHub User: {GITHUB_USERNAME}")
    print(f"  📦 Repository: {REPO_NAME}")
    print(f"  🌿 Branch: {BRANCH}")
    print(f"  🔗 URL: https://github.com/{GITHUB_USERNAME}/{REPO_NAME}")

def main():
    """Main function"""
    print(f"{Colors.BOLD}{Colors.CYAN}")
    print("=" * 60)
    print("    🚀 GitHub Migration Script - BRAINix TradeX 2")
    print("=" * 60)
    print(Colors.END)
    
    # Step 1: Configuration validation
    if not validate_environment():
        sys.exit(1)
    
    # Step 2: GitHub connectivity test
    if not test_github_connectivity():
        sys.exit(1)
    
    # Step 3: Git initialization
    if not initialize_git_repo():
        sys.exit(1)
    
    # Step 4: Create .gitignore
    if not create_comprehensive_gitignore():
        print_status("Continuing without .gitignore...", "warning")
    
    # Step 5: Setup remote
    if not setup_remote():
        sys.exit(1)
    
    # Step 6: Commit and push
    if not commit_and_push():
        sys.exit(1)
    
    # Display final summary
    print("\n" + "=" * 60)
    print_status("GitHub migration completed successfully! 🎊", "success")
    show_project_summary()
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_status("\nOperation cancelled by user", "warning")
        sys.exit(0)
    except Exception as e:
        print_status(f"Unexpected error: {e}", "error")
        sys.exit(1)