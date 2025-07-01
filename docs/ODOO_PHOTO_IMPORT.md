# Odoo Product Photo Import Guide

This guide explains how to import product photos from Odoo into the e-commerce system.

## Overview

The photo import process consists of three main steps:
1. **Identify unmapped products** - Find products that don't have an `odoo_id`
2. **Match products** - Match local products with Odoo products by SKU or name
3. **Import photos** - Batch import photos from Odoo for matched products

## Prerequisites

- Admin access to the system
- Odoo API credentials configured in environment variables:
  - `ODOO_URL`
  - `ODOO_DB`
  - `ODOO_USERNAME`
  - `ODOO_API_KEY`
- Products must exist in both systems

## API Endpoints

### 1. Identify Unmapped Products
```
GET /api/products/identify-unmapped
```
Returns products without `odoo_id` and statistics about mapping coverage.

### 2. Match Products with Odoo
```
POST /api/products/match-odoo
```
Request body:
```json
{
  "dryRun": true  // Set to false to actually update products
}
```
Matches products by SKU first, then by name. Updates `odoo_id` field.

### 3. Import Photos
```
POST /api/products/import-photos
```
Request body:
```json
{
  "batchSize": 50,
  "offset": 0,
  "onlyMissingPhotos": true
}
```
Imports photos for a single batch of products.

### 4. Batch Import Photos (Recommended for large datasets)
```
POST /api/products/batch-import-photos
```
Request body:
```json
{
  "totalBatches": 10,
  "batchSize": 50,
  "startFrom": 0,
  "onlyMissingPhotos": true
}
```
Processes multiple batches in one request with progress tracking.

### 5. Import Status
```
GET /api/products/import-status
```
Returns comprehensive statistics and recommendations for the import process.

## Using the Import Script

### Basic Usage
```bash
# Run the complete import process
npm run import-odoo-photos

# Preview matches without making changes
npm run import-odoo-photos:dry-run

# Custom batch settings
npm run import-odoo-photos -- --batch-size=100 --total-batches=20

# Import all photos (including products that already have photos)
npm run import-odoo-photos -- --all-photos
```

### Environment Variables
Create a `.env` file with:
```env
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-admin-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Admin UI Component

Add the `OdooPhotoImport` component to your admin dashboard:

```tsx
import { OdooPhotoImport } from "@/components/admin/odoo-photo-import"

export default function AdminDashboard() {
  return (
    <div>
      <OdooPhotoImport />
    </div>
  )
}
```

## Process Flow

1. **Initial Setup**
   - Ensure all products are imported from Odoo or other sources
   - Verify Odoo API credentials are configured

2. **Matching Phase**
   - Run dry-run to preview matches
   - Review unmatched products
   - Execute actual matching

3. **Photo Import Phase**
   - Import runs in batches to handle large datasets
   - Photos are uploaded to Supabase Storage
   - Both `main_image_url` and `product_images` tables are updated

4. **Monitoring**
   - Check import status regularly
   - Review sync logs for any errors
   - Verify photos in the product catalog

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Odoo credentials
   - Check API key permissions
   - Ensure XML-RPC is enabled in Odoo

2. **Matching Issues**
   - Products may have different SKUs in both systems
   - Names might have slight variations
   - Manual mapping may be required for some products

3. **Photo Import Failures**
   - Product might not have images in Odoo
   - Image format issues
   - Storage quota exceeded

### Logs

Check the following for debugging:
- Browser console for API errors
- `sync_logs` table for import history
- `admin_logs` table for detailed action logs
- Server logs for Odoo connection issues

## Performance Considerations

- Default batch size is 50 products
- Each batch includes a 500ms delay to prevent overload
- Large images are automatically optimized
- Process 2000+ products by running multiple batch imports

## Security

- All endpoints require admin authentication
- Odoo credentials are never exposed to the client
- Images are validated before upload
- Rate limiting is applied to prevent abuse