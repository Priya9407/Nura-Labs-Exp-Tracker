# Gunicorn Configuration for Production
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"

# Worker processes - (2 x CPU cores) + 1
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000

# Timeout settings
timeout = 30
keepalive = 2

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'experiment_platform'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn.pid'

# Preload app for lower memory usage
preload_app = True

# Worker temporary directory
worker_tmp_dir = '/dev/shm'
