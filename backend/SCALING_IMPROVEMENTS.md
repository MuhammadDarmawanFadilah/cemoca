# Video & WhatsApp Blast Scaling Improvements

## Overview
This document describes the improvements made to handle **1000 videos** and **1000 WhatsApp messages** reliably.

## Changes Made

### 1. WhatsApp Bulk API (Wablas v2)
**File:** `WhatsAppService.java`

- **NEW:** `sendBulkMessages()` method using Wablas v2 API (`/api/v2/send-message`)
- Supports **up to 100 messages per batch** (API limit)
- Automatically splits larger batches
- Includes retry option for failed messages
- DTOs: `BulkMessageItem`, `BulkMessageResult`

**Performance Improvement:**
- OLD: 1000 messages × 2s delay = **33+ minutes**
- NEW: 10 batches × 100 messages + 500ms between batches = **~5 minutes**

### 2. Parallel Video Generation (D-ID API)
**File:** `VideoReportService.java`

- **NEW:** `processVideoItem()` method for parallel processing
- Uses `CompletableFuture` with configurable parallelism (default: 10 concurrent)
- Batch processing with progress saves (default: 50 items per batch)
- Parallel clip status checking for large batches

**Performance Improvement:**
- OLD: 1000 videos × 1s delay = **16+ minutes** (just to submit)
- NEW: 10 concurrent × 50 batches = **~2 minutes** (to submit)

### 3. Retry Logic
**Files:** `VideoReportService.java`, `DIDService.java`

- **NEW:** `retryFailedVideos()` - Retry all failed video items
- **NEW:** `retryFailedWaMessages()` - Retry all failed WA messages
- **NEW:** D-ID API retry with exponential backoff (3 attempts)

### 4. Async Configuration
**File:** `AsyncConfig.java` (NEW)

- Thread pool: Core 10, Max 50, Queue 500
- Custom uncaught exception handler
- Graceful shutdown with 60s await

### 5. API Endpoints Added
**File:** `VideoReportController.java`

- `POST /api/video-reports/{id}/retry-failed-videos` - Retry failed videos
- `POST /api/video-reports/{id}/retry-failed-wa` - Retry failed WA messages

## Configuration

### Constants
```java
// VideoReportService.java
VIDEO_GENERATION_PARALLELISM = 10  // Concurrent D-ID API calls
VIDEO_GENERATION_BATCH_SIZE = 50   // Items per batch

// WhatsAppService.java
BULK_BATCH_SIZE = 100              // Max messages per Wablas v2 API call

// DIDService.java
MAX_RETRIES = 3                    // D-ID API retry attempts
RETRY_DELAY = 2 seconds            // Initial retry delay
READ_TIMEOUT = 60 seconds          // D-ID API timeout
```

## API Documentation References

### Wablas v2 Bulk API
```
POST https://tegal.wablas.com/api/v2/send-message
Authorization: {token}
Content-Type: application/json

{
  "data": [
    { "phone": "62xxx", "message": "text" },
    ...
  ],
  "retry": true,
  "priority": false
}
```

### D-ID Clips API
```
POST https://api.d-id.com/clips
POST https://api.d-id.com/scenes

Status lifecycle: created → started → done
Performance: 100 FPS rendering, handles tens of thousands in parallel
```

## Testing Checklist for 1000 Items

- [ ] Upload Excel with 1000 rows
- [ ] Verify video generation starts with parallel processing
- [ ] Monitor progress in batches of 50
- [ ] Verify all 1000 D-ID clips are created
- [ ] Wait for all clips to complete (status: done)
- [ ] Verify WA blast starts with bulk API
- [ ] Monitor WA blast completes in ~5-10 minutes
- [ ] Check for any failed items
- [ ] Test retry functionality for failed items
- [ ] Verify all videos delivered via WhatsApp

## Error Handling

1. **D-ID API Failures:** Automatic retry with exponential backoff (2s, 4s, 6s)
2. **Wablas API Failures:** Batch-level error tracking, individual item status
3. **Network Timeouts:** Configured 10s connect, 30s read (REST), 60s read (D-ID WebClient)
4. **Rate Limiting:** Delays between batches (500ms for videos, 500ms for WA)

## Logs to Monitor

```
[VIDEO GEN] Starting video generation for report X
[VIDEO GEN] Processing batch Y/Z (N items)
[VIDEO GEN] Completed video generation for report X

[WA BLAST] Starting WA blast for report X, N items ready
[WA BLAST] Using Wablas v2 Bulk API (batch size: 100)
[WA BLAST] Completed for report X: N sent, M failed
```
