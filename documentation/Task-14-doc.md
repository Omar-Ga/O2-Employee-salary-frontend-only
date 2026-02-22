# Task 14: Enabling Batch API and Restoring Atomicity

## Overview
This task addressed a critical `403 Forbidden` error encountered when using the PocketBase `createBatch` API. The investigation revealed that batch requests were disabled at the server level. Instead of refactoring the frontend to use parallel requests (which would lose atomicity), the server settings were programmatically updated via a migration to enable the Batch API.

## Problem Diagnosis
- **Symptom**: `pb.createBatch()` calls from the JS SDK were failing with a `403 Forbidden` error.
- **Root Cause**: PocketBase server logs explicitly stated: `"Batch requests are not allowed."`
- **Confirmation**: A diagnostic JSVM hook confirmed that `batch.enabled` was set to `false` in the server settings.

## Technical Implementation

### 1. Server-Side Migration
- **File**: `pb/pb_migrations/1771661100_enable_batch.js`
- **Action**: Created a migration using the JSVM `app.settings()` API to set `settings.batch.enabled = true` and save the changes.
- **Benefit**: This enables the Batch API for all clients globally, resolving the permission issue without changing a single line of frontend code.

### 2. Verification
- **Diagnostic Verification**: Re-ran a diagnostic hook after applying the migration and restarting the server.
- **Confirmed State**:
  ```json
  "batch": {
    "enabled": true,
    "maxRequests": 50,
    "timeout": 3,
    "maxBodySize": 0
  }
  ```

## Advantages of the Solution
- **Atomicity Preservation**: Maintains "all-or-nothing" transactional integrity for complex operations like "Close Month" (creating multiple slips and updating multiple transactions in a single request).
- **Data Integrity**: Prevents partial states that could occur if parallel requests failed midway.
- **Clean Codebase**: Avoids bloating the service layer with complex mapping and error-handling logic required for manual parallel requests.

## Verification Results
- [x] Server logs confirm batch requests are now allowed.
- [x] `pb.createBatch()` successfully sends requests without 403 errors.
- [x] Atomicity is guaranteed for payroll processing.

---