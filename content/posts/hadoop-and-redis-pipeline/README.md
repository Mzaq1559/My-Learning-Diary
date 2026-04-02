---
title: "Hadoop + Redis: Building a Big Data Pipeline with a High-Speed Cache Layer"
slug: hadoop-and-redis-pipeline
date: 2023-12-10
tags: [hadoop, redis, big-data, python, fastapi]
category: projects
series: devops-and-cloud
seriesOrder: 9
---

For my big data course project, I built a pipeline that processes massive datasets with Hadoop and caches frequently accessed results in Redis. The goal was to demonstrate how you can combine batch processing with real-time caching to get the best of both worlds—Hadoop's processing power and Redis's sub-millisecond response times.

## The Problem: Query Latency on Large Datasets

When analyzing multi-gigabyte datasets stored in HDFS, even simple aggregation queries can take minutes. For a web application serving analytics dashboards, that's unacceptable. Users expect instant results. My solution: run MapReduce jobs to pre-compute aggregations and store the results in Redis for lightning-fast retrieval.

## Architecture Overview

The pipeline has three stages. First, raw data gets ingested into HDFS using Flume. Second, MapReduce jobs process the data—filtering, aggregating, and computing statistics. Third, results are written to Redis with TTL expiration. A REST API layer sits in front of Redis to serve queries to the frontend. This architecture separates concerns beautifully.

```
# Data flow
Raw Logs → Flume → HDFS
              ↓
         MapReduce Job
              ↓
          Redis Cache ← FastAPI ← Frontend Dashboard

# Redis key structure
analytics:daily:2024-03-15:page_views → "150234"
analytics:daily:2024-03-15:unique_users → "45123"
analytics:hourly:2024-03-15T14:00:00:top_pages → JSON array
```

## MapReduce for Data Aggregation

I wrote a MapReduce job in Python using Hadoop Streaming. The mapper extracts timestamps and user IDs from log entries. The reducer aggregates counts per day and computes unique users. Hadoop handles distribution across cluster nodes automatically—I just define the map and reduce logic.

```python
#!/usr/bin/env python3
# mapper.py
import sys
from datetime import datetime

for line in sys.stdin:
    try:
        timestamp, user_id, page = line.strip().split('\t')
        date = datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d')
        print(f'{date}\t{user_id}\t{page}')
    except:
        continue

# reducer.py
import sys
from collections import defaultdict

daily_stats = defaultdict(lambda: {'views': 0, 'users': set()})

for line in sys.stdin:
    date, user_id, page = line.strip().split('\t')
    daily_stats[date]['views'] += 1
    daily_stats[date]['users'].add(user_id)

for date, stats in daily_stats.items():
    print(f'{date}\t{stats["views"]}\t{len(stats["users"])}')
```

## Writing Results to Redis

After the MapReduce job completes, a Python script reads the output from HDFS and pushes it to Redis. I use pipeline commands to batch writes for better performance. Each key gets a 7-day TTL—old data expires automatically. Redis's in-memory storage makes subsequent queries instant.

```python
import redis
from hdfs import InsecureClient

# Connect to HDFS and Redis
hdfs_client = InsecureClient('http://namenode:9870', user='hadoop')
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Read MapReduce output
with hdfs_client.read('/output/daily_stats/part-00000') as reader:
    pipeline = redis_client.pipeline()
    
    for line in reader:
        date, views, unique_users = line.decode().strip().split('\t')
        
        pipeline.set(f'analytics:daily:{date}:views', views, ex=604800)
        pipeline.set(f'analytics:daily:{date}:unique_users', unique_users, ex=604800)
    
    pipeline.execute()

print("Data cached successfully in Redis")
```

## FastAPI Service Layer

The frontend hits a FastAPI service that queries Redis. If data exists in cache, return it immediately. If not, the API triggers a new MapReduce job and returns a 202 Accepted with a retry-after header. This async pattern keeps the API responsive while handling cache misses gracefully.

```python
from fastapi import FastAPI, HTTPException
from redis import Redis
from datetime import datetime

app = FastAPI()
redis_client = Redis(host='redis', port=6379, decode_responses=True)

@app.get("/analytics/daily/{date}")
async def get_daily_stats(date: str):
    views = redis_client.get(f'analytics:daily:{date}:views')
    users = redis_client.get(f'analytics:daily:{date}:unique_users')
    
    if not views or not users:
        # Trigger MapReduce job asynchronously
        # Return 202 Accepted - client should retry
        return {"status": "processing", "retry_after": 60}
    
    return {
        "date": date,
        "page_views": int(views),
        "unique_users": int(users)
    }
```

## Results & Lessons Learned

The pipeline reduced average query time from 3 minutes (direct HDFS MapReduce) to under 5 milliseconds (Redis cache hit). The hybrid approach works beautifully—Hadoop handles the heavy lifting overnight, Redis serves results instantly during the day. Key lesson: choose the right tool for each part of your pipeline. Don't force one technology to do everything.

This project taught me the practical realities of big data architecture. Distributed systems are complex, but breaking them into clear stages with well-defined interfaces makes them manageable. The combination of batch processing and caching is a pattern I'll use again in future projects.
