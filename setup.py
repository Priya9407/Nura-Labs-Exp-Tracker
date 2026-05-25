#!/usr/bin/env python3
"""
Setup script for Experiment Platform
"""

import subprocess
import sys
import os

def run_command(cmd, cwd=None):
    """Run a shell command and print output."""
    print(f"\n>>> {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=False)
    return result.returncode == 0

def main():
    print("=" * 60)
    print("Experiment Platform - Setup")
    print("=" * 60)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dir = os.path.join(base_dir, 'frontend')

    # 1. Install Python dependencies
    print("\n[1/4] Installing Python dependencies...")
    if not run_command(f"{sys.executable} -m pip install -r requirements.txt", cwd=backend_dir):
        print("Failed to install Python dependencies")
        return 1

    # 2. Create .env file if it doesn't exist
    print("\n[2/4] Checking environment configuration...")
    env_file = os.path.join(base_dir, '.env')
    if not os.path.exists(env_file):
        print("Creating .env file from template...")
        env_example = os.path.join(base_dir, '.env.example')
        with open(env_example, 'r') as f:
            content = f.read()
        with open(env_file, 'w') as f:
            f.write(content)
        print(f"Created {env_file}")
        print("⚠️  IMPORTANT: Please edit .env and set your configuration values:")
        print("   - ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD (for initial admin)")
        print("   - SESSION_SECRET")
    else:
        print("Environment file already exists")

    # 3. Install Node dependencies
    print("\n[3/4] Installing Node dependencies...")
    if os.path.exists(os.path.join(frontend_dir, 'package.json')):
        if not run_command("npm install", cwd=frontend_dir):
            print("Failed to install Node dependencies")
            return 1
    else:
        print("No package.json found, skipping Node dependencies")

    # 4. Build frontend
    print("\n[4/4] Building frontend...")
    if os.path.exists(os.path.join(frontend_dir, 'package.json')):
        if not run_command("npm run build", cwd=frontend_dir):
            print("Failed to build frontend")
            return 1
    else:
        print("No frontend build configured")

    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print("\nTo start the application:")
    print("1. Ensure MongoDB is running (mongod)")
    print("2. Ensure Redis is running (redis-server)")
    print("3. Run: python backend/app.py")
    print("\nThe application will be available at: http://localhost:5000")
    print("=" * 60)

    return 0

if __name__ == '__main__':
    sys.exit(main())
