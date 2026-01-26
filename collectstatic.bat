@echo off
REM Run Django collectstatic using the local virtual environment
.venv\Scripts\python.exe manage.py collectstatic --noinput

