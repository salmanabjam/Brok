import os
import subprocess
import sys
from dotenv import load_dotenv

load_dotenv()

PROJECT_DIR     = os.getenv("PROJECT_DIR")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
GITHUB_TOKEN    = os.getenv("GITHUB_TOKEN")
REPO_NAME       = os.getenv("REPO_NAME")
BRANCH          = os.getenv("BRANCH", "main")

def run(cmd):
    try:
        print(f"> {cmd}")
        subprocess.run(cmd, shell=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"⛔ خطا در اجرای دستور: {cmd}\n{e}", file=sys.stderr)
        sys.exit(1)

def git(cmd):
    return run(f'cd "{PROJECT_DIR}" && git {cmd}')

def ensure_gitignore():
    gi = os.path.join(PROJECT_DIR, ".gitignore")
    if not os.path.exists(gi):
        content = """\
# Visual Studio
.vs/
*.suo
*.user
*.userosscache
*.sln.docstates

# Build folders
[Bb]in/
[Oo]bj/

# VS Code
.vscode/
"""
        with open(gi, "w", encoding="utf-8") as f:
            f.write(content)
        git("add .gitignore")
        git('commit -m "Add .gitignore to exclude VS temp files"')

def main():
    if not all([PROJECT_DIR, GITHUB_USERNAME, GITHUB_TOKEN, REPO_NAME]):
        print("❗ یکی از مقادیر .env خالی است.", file=sys.stderr)
        sys.exit(1)
    if not os.path.isdir(PROJECT_DIR):
        print(f"❗ مسیر پروژه پیدا نشد: {PROJECT_DIR}", file=sys.stderr)
        sys.exit(1)

    # init & branch
    if not os.path.isdir(os.path.join(PROJECT_DIR, ".git")):
        git("init")
        git(f'checkout -b {BRANCH}')

    # remote
    remote_url = f"https://{GITHUB_USERNAME}:{GITHUB_TOKEN}@github.com/{GITHUB_USERNAME}/{REPO_NAME}.git"
    remotes = subprocess.check_output(f'cd "{PROJECT_DIR}" && git remote', shell=True).decode().split()
    if "origin" not in remotes:
        git(f"remote add origin {remote_url}")
    else:
        git(f"remote set-url origin {remote_url}")

    # ایجاد یا به‌روز کردن .gitignore
    ensure_gitignore()

    # status
    status = subprocess.check_output(f'cd "{PROJECT_DIR}" && git status --porcelain', shell=True).decode().strip()
    if not status:
        print("✅ تغییری برای کامیت وجود ندارد.")
        return

    # add, commit, push
    git("add .")
    git('commit -m "Auto-commit by script"')
    git(f"push -u origin {BRANCH}")

if __name__ == "__main__":
    main()
