# Consultant Photo Import from Odoo

This document explains how to import consultant photos from Odoo to your application.

## Overview

The consultant photo import process consists of two main steps:
1. **Matching consultants** by email between your database and Odoo
2. **Importing photos** from Odoo to Supabase Storage

## Prerequisites

1. Odoo API credentials configured in environment variables:
   - `ODOO_URL`
   - `ODOO_DB`
   - `ODOO_USERNAME`
   - `ODOO_API_KEY`

2. Admin authentication to access the endpoints

## API Endpoints

### 1. Match Consultants by Email

**Endpoint:** `POST /api/odoo/match-consultants`

This endpoint matches consultants in your database with Odoo partners by email and updates the `odoo_id` field.

**Request:**
```json
POST /api/odoo/match-consultants
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "matched": 25,
  "notFound": 5,
  "totalConsultants": 30,
  "totalOdooPartners": 150,
  "matchResults": [...],
  "notFoundEmails": [...],
  "message": "Matched 25 consultants with Odoo partners"
}
```

### 2. Import Consultant Photos

**Endpoint:** `POST /api/odoo/import-consultant-photos`

Imports photos for consultants that have been matched with Odoo (have `odoo_id`).

**Request:**
```json
POST /api/odoo/import-consultant-photos
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "limit": 50,        // Optional: number of consultants to process (default: 50)
  "offset": 0,        // Optional: pagination offset
  "consultantId": "" // Optional: import for specific consultant
}
```

**Response:**
```json
{
  "success": true,
  "updated": 20,
  "skipped": 5,
  "errors": 0,
  "processed": 25,
  "totalConsultants": 100,
  "hasMore": true,
  "results": [...],
  "message": "20 fotos importadas com sucesso"
}
```

### 3. Combined Sync Endpoint

**Endpoint:** `POST /api/odoo/sync-consultant-photos`

This endpoint combines both matching and photo import in a single operation.

**Request:**
```json
POST /api/odoo/sync-consultant-photos
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "matchOnly": false,     // Only match, don't import photos
  "importOnly": false,    // Only import photos, don't match
  "forceUpdate": false,   // Update even if photo exists
  "limit": 100           // Limit number of consultants to process
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "matched": 15,
    "photosImported": 45,
    "skipped": 10,
    "errors": 2,
    "details": [...]
  },
  "stats": {
    "total": 100,
    "linked": 85,
    "withPhotos": 60,
    "percentLinked": "85.0",
    "percentWithPhotos": "60.0"
  },
  "message": "Sincronização concluída: 15 correspondências, 45 fotos importadas"
}
```

### 4. Check Import Status

**Endpoint:** `GET /api/odoo/import-consultant-photos`

Returns statistics about the current import status.

**Request:**
```
GET /api/odoo/import-consultant-photos
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "linked": 85,
    "withPhotos": 60,
    "needsPhoto": 25,
    "percentLinked": "85.0",
    "percentWithPhotos": "60.0"
  }
}
```

## Database Schema

The following fields are used for consultant photo management:

- `odoo_id`: Integer ID from Odoo partner record
- `profile_image_url`: Public URL of the photo in Supabase Storage
- `odoo_image_1920`: Base64 encoded image from Odoo (stored for backup)

## Storage Configuration

Photos are stored in the `consultant-profiles` bucket in Supabase Storage with the following structure:
- Bucket name: `consultant-profiles`
- File naming: `consultant-{odoo_id}-{timestamp}.jpg`
- Access: Public read, admin-only write

## Usage Workflow

### Full Import Process

1. **First-time setup:**
   ```bash
   # 1. Match all consultants
   curl -X POST http://localhost:3000/api/odoo/match-consultants \
     -H "Authorization: Bearer <token>"
   
   # 2. Import all photos
   curl -X POST http://localhost:3000/api/odoo/sync-consultant-photos \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"importOnly": true}'
   ```

2. **Regular sync (match new consultants and import photos):**
   ```bash
   curl -X POST http://localhost:3000/api/odoo/sync-consultant-photos \
     -H "Authorization: Bearer <token>"
   ```

3. **Check status:**
   ```bash
   curl http://localhost:3000/api/odoo/import-consultant-photos \
     -H "Authorization: Bearer <token>"
   ```

### Batch Processing

For large datasets, process in batches:

```javascript
// Example: Import photos in batches of 50
let offset = 0;
const limit = 50;
let hasMore = true;

while (hasMore) {
  const response = await fetch('/api/odoo/import-consultant-photos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ limit, offset })
  });
  
  const result = await response.json();
  hasMore = result.hasMore;
  offset += limit;
  
  console.log(`Processed ${result.processed} consultants, ${result.updated} photos imported`);
  
  // Add delay between batches
  if (hasMore) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

## Testing

Use the provided test script:

```bash
npm run test:consultant-photo-import
```

Or manually test with the test script:

```bash
node scripts/test-consultant-photo-import.ts
```

## Troubleshooting

### Common Issues

1. **No matches found:**
   - Verify email addresses match exactly between systems
   - Check if consultants in Odoo have `partner_type = 'consultant'`
   - Ensure emails are not empty in either system

2. **Photos not importing:**
   - Check if Odoo partners have `image_1920` field populated
   - Verify storage bucket permissions
   - Check Supabase Storage quota

3. **Timeout errors:**
   - Reduce batch size using the `limit` parameter
   - Process in smaller chunks
   - Add delays between batches

### Debugging

Enable detailed logging by checking the server console output. Each operation logs:
- ✅ Successful matches/imports
- ⚠️ Skipped items
- ❌ Errors with details

## Security

All endpoints require admin authentication. The storage bucket is configured with:
- Public read access for viewing photos
- Admin-only write access for uploading
- Automatic file overwrite protection (unique timestamps)