#!/usr/bin/env python3
"""
Update AI API dependencies to fix PyTorch security vulnerability
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    print("🚀 Starting AI API dependency update...")
    
    # Check if we're in the right directory
    if not os.path.exists("requirements.txt"):
        print("❌ Error: requirements.txt not found. Please run this script from the ai_api directory.")
        sys.exit(1)
    
    # Update pip first
    if not run_command("pip install --upgrade pip", "Upgrading pip"):
        print("⚠️  Warning: pip upgrade failed, continuing...")
    
    # Install compatible PyTorch version
    if not run_command("pip install torch==2.2.2 torchvision==0.17.2", "Installing PyTorch 2.2.2"):
        print("❌ PyTorch installation failed!")
        sys.exit(1)
    
    # Install compatible transformers version
    if not run_command("pip install transformers==4.49.0", "Installing transformers 4.49.0"):
        print("❌ Transformers installation failed!")
        sys.exit(1)
    
    # Install other requirements
    if not run_command("pip install -r requirements.txt", "Installing other requirements"):
        print("❌ Requirements installation failed!")
        sys.exit(1)
    
    print("\n🎉 All dependencies updated successfully!")
    print("\n📋 Current versions:")
    run_command("pip list | grep -E '(torch|transformers|ultralytics)'", "Checking installed versions")

if __name__ == "__main__":
    main()
