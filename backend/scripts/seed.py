#!/usr/bin/env python3
"""Seed demo jobs for development."""
import httpx
import random
import time

API = "http://localhost:8000/api/v1"

DEMO_JOBS = [
    {"name": "Weekly Sales Report", "task_name": "generate_report", "queue": "analytics", "priority": "high",
     "kwargs": {"report_type": "sales", "date_range": {"start": "2024-01-01", "end": "2024-12-31"}}},
    {"name": "New User Welcome Email", "task_name": "send_email", "queue": "email", "priority": "high",
     "kwargs": {"to": "newuser@example.com", "subject": "Welcome to TaskForge!", "body": "Welcome aboard!"}},
    {"name": "User Data Export", "task_name": "export_data", "queue": "low", "priority": "low",
     "kwargs": {"query": {"table": "users"}, "format": "csv", "destination": "s3"}},
    {"name": "Video Transcode - Intro", "task_name": "transcode_video", "queue": "default", "priority": "default",
     "kwargs": {"input_url": "https://cdn.example.com/raw/intro.mp4", "output_format": "mp4", "quality": "1080p"}},
    {"name": "Process Uploads CSV", "task_name": "process_csv", "queue": "default", "priority": "default",
     "kwargs": {"file_path": "/uploads/batch_jan.csv"}},
    {"name": "Event Tracking Batch", "task_name": "track_event", "queue": "analytics", "priority": "low",
     "kwargs": {"event_name": "page_view", "properties": {"page": "/dashboard"}, "user_id": "usr_123"}},
    {"name": "Marketing Campaign Email", "task_name": "send_bulk_email", "queue": "email", "priority": "default",
     "kwargs": {"recipients": [f"user{i}@example.com" for i in range(1, 51)], "subject": "Q1 Update", "body": "Hello!"}},
    {"name": "Product Thumbnails", "task_name": "generate_thumbnail", "queue": "high", "priority": "high",
     "kwargs": {"image_url": "https://cdn.example.com/product.jpg", "sizes": ["64x64", "128x128", "512x512"]}},
    {"name": "Compute Monthly KPIs", "task_name": "compute_aggregates", "queue": "analytics", "priority": "high",
     "kwargs": {"dataset": "orders", "dimensions": ["region", "product"], "metrics": ["revenue", "count"]}},
    {"name": "DB Sync — Prod to Staging", "task_name": "sync_database", "queue": "default", "priority": "low",
     "kwargs": {"source": "prod-db", "destination": "staging-db", "tables": ["users", "orders", "products"]}},
]

def main():
    print(f"🌱 Seeding {len(DEMO_JOBS)} demo jobs...")
    success = 0
    for job in DEMO_JOBS:
        try:
            r = httpx.post(f"{API}/jobs/", json=job, timeout=5)
            r.raise_for_status()
            data = r.json()
            print(f"  ✓ {job['name']} [{data['id'][:8]}]")
            success += 1
            time.sleep(0.1)
        except Exception as e:
            print(f"  ✗ {job['name']}: {e}")

    print(f"\n✅ Seeded {success}/{len(DEMO_JOBS)} jobs")
    print(f"   View at: http://localhost:3000/jobs")

if __name__ == "__main__":
    main()
