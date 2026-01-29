# Bulk Upload Documentation

## Overview

The bulk upload feature allows you to import multiple products, their variants, and images into the Giftus system using an Excel file. This significantly speeds up product catalog management.

## Features

- ✅ Import products with categories
- ✅ Automatic category creation if not exists
- ✅ Add product variants in bulk
- ✅ Automatic image download and storage
- ✅ Update existing products or create new ones
- ✅ Detailed error reporting and success summaries
- ✅ Support for customizable products

## API Endpoints

### 1. Upload Bulk Data
**POST** `/api/bulkupload/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body: Excel file (.xlsx or .xls)
- Max File Size: 10 MB

**Response:**
```json
{
  "message": "Bulk upload completed",
  "summary": {
    "totalRows": 5,
    "successfulRows": 5,
    "failedRows": 0,
    "errors": []
  }
}
```

### 2. Download Template
**GET** `/api/bulkupload/template`

**Response:** CSV file with template structure

---

## Excel Template Format

### Required Columns

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Category | String | ✅ | Product category name | Trophy, Crystal |
| ModelNo | String | ✅ | Unique model number | TPHY001, CRYS001 |
| ProductName | String | ✅ | Product display name | Gold Trophy, Crystal Award |
| Slug | String | ❌ | URL-friendly slug (auto-generated if empty) | gold-trophy |
| Description | String | ❌ | Product description | Premium gold trophy |
| ImageUrl | String | ❌ | Image URL to download | https://example.com/image.jpg |
| VideoUrl | String | ❌ | Video URL | https://example.com/video.mp4 |
| GstPercent | Number | ❌ | GST percentage (default: 18) | 18, 5, 12 |
| IsCustomizable | String | ❌ | "Yes" or "true" for customizable | Yes, No, true, false |
| Variants | JSON | ❌ | Product variants in JSON array | See below |

### Variants JSON Format

Variants should be provided as a JSON string in the `Variants` column:

```json
[
  {
    "name": "Size",
    "value": "Small",
    "price": 500,
    "stockQty": 10
  },
  {
    "name": "Size",
    "value": "Medium",
    "price": 600,
    "stockQty": 15
  },
  {
    "name": "Engraving",
    "value": "Yes",
    "price": 100,
    "stockQty": 0
  }
]
```

Or as a single-line JSON string in Excel (escape quotes):
```
[{"name":"Size","value":"Small","price":500,"stockQty":10},{"name":"Size","value":"Medium","price":600,"stockQty":15}]
```

---

## Example Data

### Minimal Example
```
Category,ModelNo,ProductName
Trophy,TPHY001,Gold Trophy
Crystal,CRYS001,Crystal Award
```

### Complete Example
```
Category,ModelNo,ProductName,Slug,Description,ImageUrl,VideoUrl,GstPercent,IsCustomizable,Variants
Trophy,TPHY001,Gold Trophy,gold-trophy,Premium gold trophy for winners,https://example.com/gold-trophy.jpg,https://example.com/gold-trophy.mp4,18,No,"[{""name"":""Size"",""value"":""Small"",""price"":500},{""name"":""Size"",""value"":""Large"",""price"":700}]"
Crystal,CRYS001,Crystal Award,crystal-award,Elegant crystal award,https://example.com/crystal.jpg,,18,Yes,"[{""name"":""Engraving"",""value"":""Yes"",""price"":100}]"
Sports,SPRT001,Sports Medal,sports-medal,Sports achievement medal,,https://example.com/medal.mp4,5,No,
```

---

## Image Handling

### Image Storage
- Images are downloaded from provided URLs
- Stored in: `resources/images/`
- File naming: `{ModelNo}_base.{extension}`
- Supported formats: JPEG, PNG, WebP, GIF

### Image Updates
- Existing images are overwritten if a new URL is provided
- If no URL is provided, existing image is kept
- Failed image downloads don't stop product creation

### Image Path in Database
- Images are stored as relative URLs
- Example: `/resources/images/TPHY001_base.jpg`
- Use this path in frontend for display

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No file provided" | File upload failed | Try uploading again |
| "File size exceeds 10 MB limit" | File too large | Reduce number of rows or images |
| "Only Excel files (.xlsx, .xls) are supported" | Wrong file type | Use Excel format |
| "Category is required" | Missing Category column | Add Category column |
| "ModelNo is required" | Missing ModelNo column | Add ModelNo and ensure unique values |
| "Product variant X already exists" | Duplicate variant | Remove duplicate variant rows |

### Success Summary

After upload, you'll see:
- **Total Rows**: Number of data rows processed
- **Successful Rows**: Products created/updated successfully
- **Failed Rows**: Products that failed to import
- **Errors**: List of specific errors for failed rows

---

## Frontend UI

### Access
- URL: `/admin/bulk-upload-new`
- Features:
  - Download template button
  - Drag-and-drop upload area
  - File size display
  - Real-time upload progress
  - Success/failure summary with stats
  - Error list display

### Workflow
1. Click "Download Excel Template"
2. Fill in your product data
3. Drag & drop file or click to select
4. Click "Upload Products"
5. Review results

---

## Database Schema Changes

### Products Table
- New products are created with `IsActive = true`
- New categories are automatically created if they don't exist
- Existing products with the same ModelNo are updated

### ProductVariants Table
- Variants are added only if they don't already exist
- Composite unique key: (ProductId, VariantName, VariantValue)

### ProductImages Table
- Images are stored as separate records
- BaseImageUrl is updated in Products table

---

## Best Practices

### Data Preparation
1. ✅ Keep ModelNo values unique
2. ✅ Use consistent category names
3. ✅ Verify image URLs are accessible
4. ✅ Use JSON format for variants
5. ✅ Test with small batch first

### Image URLs
1. ✅ Use HTTPS URLs
2. ✅ Ensure images are publicly accessible
3. ✅ Keep image sizes reasonable (< 5MB each)
4. ✅ Test URLs before bulk upload

### Error Recovery
1. ✅ Download and review error list
2. ✅ Fix issues in your Excel file
3. ✅ Retry upload
4. ✅ Check database for partial imports

---

## Limitations

- ⚠️ Maximum file size: 10 MB
- ⚠️ Excel files only (.xlsx, .xls)
- ⚠️ Single worksheet per file
- ⚠️ Image URLs must be publicly accessible
- ⚠️ Maximum 10,000 rows per file (recommended)

---

## Future Enhancements

- [ ] Batch image upload (ZIP file)
- [ ] Image URL validation before upload
- [ ] Product image gallery management
- [ ] Bulk price updates
- [ ] Scheduled bulk imports
- [ ] Import history and versioning
- [ ] Product deactivation in bulk

---

## Support

For issues or questions:
1. Check error messages in upload summary
2. Verify Excel file format
3. Ensure image URLs are accessible
4. Check API logs for detailed errors

