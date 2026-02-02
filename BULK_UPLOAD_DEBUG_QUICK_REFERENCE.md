# Bulk Upload Debug Points - Quick Reference

## Frontend: apiHandler.ts

```typescript
export async function uploadBulkMatrixFile(
  file: File,
  category: string = "",
): Promise<BulkUploadSummary> {
  try {
    // ┌─────────────────────────────────────────────────┐
    // │ BREAKPOINT #1: Line 167 - FormData Creation    │
    // │ Check: file name, size, type                   │
    // └─────────────────────────────────────────────────┘
    const formData = new FormData(); // ← BREAKPOINT HERE
    formData.append("file", file);
    if (category) {
      formData.append("category", category);
    }

    const url = `${API_BASE_URL}/api/bulkupload/upload-matrix`;
    console.log(
      `[API] File: ${file.name}, Size: ${file.size}, Category: ${category}`,
    );

    // ┌─────────────────────────────────────────────────┐
    // │ BREAKPOINT #2: Line 174 - Before Fetch         │
    // │ Check: FormData has file and category         │
    // └─────────────────────────────────────────────────┘
    const response = await fetch(url, {
      // ← BREAKPOINT HERE
      method: "POST",
      body: formData,
    });

    // ┌─────────────────────────────────────────────────┐
    // │ BREAKPOINT #3: Line 180 - After Response       │
    // │ Check: response.status (200=OK, 400=Error)    │
    // └─────────────────────────────────────────────────┘
    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      // ← BREAKPOINT HERE
      // ┌─────────────────────────────────────────────────┐
      // │ BREAKPOINT #4: Line 182 - Read Error Response  │
      // │ Check: errorText (validation failures, etc)    │
      // └─────────────────────────────────────────────────┘
      const errorText = await response.text(); // ← BREAKPOINT HERE
      console.error(`[API] Error:`, errorText);
      throw {
        message: `Bulk Upload Failed: ${response.statusText}`,
        status: response.status,
      } as ApiError;
    }

    // ┌─────────────────────────────────────────────────┐
    // │ BREAKPOINT #5: Line 186 - Success Response     │
    // │ Check: totalRows, successfulRows, failedRows  │
    // │ Check: errors array contents                   │
    // └─────────────────────────────────────────────────┘
    const data: BulkUploadSummary = await response.json(); // ← BREAKPOINT HERE
    console.log(`[API] Response:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API] Error caught:`, error);
    throw error;
  }
}
```

---

## Backend: BulkUploadMatrixController.cs

```csharp
// ┌──────────────────────────────────────────────────────┐
// │ BREAKPOINT A: Line 38 - Controller Entry            │
// │ Check: file != null, file.FileName, category value  │
// └──────────────────────────────────────────────────────┘
[HttpPost("upload-matrix")]
public async Task<ActionResult> UploadBulkMatrixData(
  [FromForm] IFormFile file,    // ← BREAKPOINT HERE
  [FromForm] string category = "")
{
  // ┌──────────────────────────────────────────────────────┐
  // │ BREAKPOINT B: Line 76 - Category Lookup             │
  // │ Check: validCategory found or null                  │
  // │ Condition: validCategory == null (breaks if invalid)│
  // └──────────────────────────────────────────────────────┘
  if (!string.IsNullOrEmpty(category))
  {
    var validCategory = await _dbContext.Categories      // ← BREAKPOINT HERE
      .FirstOrDefaultAsync(c =>
        EF.Functions.Like(c.Name, category.Replace("_", " ")) ||
        EF.Functions.Like(c.Name, category));

    if (validCategory == null)    // ← CONDITIONAL BREAKPOINT
    {
      summary.Errors.Add($"Invalid category: {category}");
      return summary;
    }
  }
}

// ┌──────────────────────────────────────────────────────┐
// │ BREAKPOINT C: Line 103-107 - Excel Processing      │
// │ Check: Worksheet count, row count                  │
// └──────────────────────────────────────────────────────┘
using (var package = new ExcelPackage(new FileInfo(tempFilePath)))
{
  if (package.Workbook.Worksheets.Count == 0)  // ← BREAKPOINT HERE
    throw new InvalidOperationException("No worksheets");

  var worksheet = package.Workbook.Worksheets[0];
  var rowCount = worksheet.Dimension?.Rows ?? 0;  // ← BREAKPOINT HERE
}

// ┌──────────────────────────────────────────────────────┐
// │ BREAKPOINT D: Line 192 - ModelNo Extraction        │
// │ Check: Raw cell value from Excel                   │
// └──────────────────────────────────────────────────────┘
private MatrixProductData ExtractProductData(ExcelWorksheet worksheet, int startRow, int startCol)
{
  var modelNo = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim();  // ← BREAKPOINT HERE

  _logger.LogInformation($"[DEBUG] ModelNo=[{modelNo}]");

  // ┌──────────────────────────────────────────────────────┐
  // │ BREAKPOINT E: Line 202 - Regex Validation          │
  // │ Check: Matches pattern: ^[A-Za-z0-9\-_\s]+$        │
  // │ Condition: !Regex.IsMatch (break if invalid)        │
  // └──────────────────────────────────────────────────────┘
  if (!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$"))  // ← BREAKPOINT HERE
  {
    _logger.LogError($"[DEBUG] Regex failed for [{modelNo}]");
    throw new ArgumentException($"Invalid SKU: '{modelNo}'");
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BREAKPOINT F: Line 225 - Price Extraction          │
  // │ Check: Raw price string (e.g., "Rs. 1,500")        │
  // └──────────────────────────────────────────────────────┘
  var priceStr = worksheet.Cells[startRow, startCol + 4].Value?.ToString()?.Trim() ?? "0";  // ← BREAKPOINT HERE

  var priceValue = ExtractPrice(priceStr);  // F11 to step into

  // ┌──────────────────────────────────────────────────────┐
  // │ BREAKPOINT G: Line 227 - Price Parsing             │
  // │ Check: Parsed decimal value                         │
  // │ Condition: price < 0 (break if negative)            │
  // └──────────────────────────────────────────────────────┘
  if (!decimal.TryParse(priceValue, out var price))  // ← BREAKPOINT HERE
    price = 0;

  if (price < 0)  // ← CONDITIONAL BREAKPOINT
    throw new ArgumentException($"Price must be positive: {price}");
}

// ┌──────────────────────────────────────────────────────┐
// │ BREAKPOINT H: Line 283 - Process Product Row       │
// │ Check: All extracted data is valid                 │
// │ Check: selectedCategory parameter received         │
// └──────────────────────────────────────────────────────┘
private async Task ProcessMatrixProductRow(
  MatrixProductData data,
  string uploadPath,
  BulkUploadSummary summary,
  string selectedCategory = "")  // ← BREAKPOINT HERE
{
  _logger.LogInformation($"[DEBUG] Process: ModelNo={data.ModelNo}, Category={selectedCategory}");

  // ┌──────────────────────────────────────────────────────┐
  // │ BREAKPOINT I: Line 305 - Category Lookup/Create    │
  // │ Check: Category exists or created                  │
  // └──────────────────────────────────────────────────────┘
  var category = await _dbContext.Categories  // ← BREAKPOINT HERE
    .FirstOrDefaultAsync(c =>
      EF.Functions.Like(c.Name, selectedCategory.Replace("_", " ")));

  // ┌──────────────────────────────────────────────────────┐
  // │ BREAKPOINT J: Line 340 - Product Creation          │
  // │ Check: All product fields set correctly            │
  // │ Check: CategoryId is valid                         │
  // └──────────────────────────────────────────────────────┘
  var product = new Product  // ← BREAKPOINT HERE
  {
    CategoryId = category.Id,
    ModelNo = data.ModelNo,
    Name = productName,
    Slug = slug,
    Price = data.Price,
    GstPercent = data.GstPercent,
    IsActive = true,
    CreatedAt = DateTime.UtcNow
  };

  _dbContext.Products.Add(product);
  await _dbContext.SaveChangesAsync();  // ← BREAKPOINT HERE - Saving
}
```

---

## Debug Workflow Diagram

```
┌─────────────────┐
│  User Browser   │
│  ├─ Select file │
│  └─ Pick category
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend (page.tsx)                │
│  Calls: uploadBulkMatrixFile()      │
│  BPs: Before & After API call       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  apiHandler.ts uploadBulkMatrixFile()               │
│  BP#1: FormData creation (L167)                    │
│  BP#2: Before fetch (L174)                         │
│  BP#3: After response (L180)                       │
│  BP#4: Error response (L182)                       │
│  BP#5: Success response (L186)                     │
└────────┬────────────────────────────────────────────┘
         │ (HTTP POST with FormData)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Backend: UploadBulkMatrixData()                    │
│  BPA: Controller entry (L38)                       │
│  BPB: Category lookup (L76)                        │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  ProcessMatrixExcelFile()                           │
│  BPC: Excel processing (L103-107)                  │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  For each product row:                              │
│  ├─ ExtractProductData()                           │
│  │  ├─ BPD: ModelNo extraction (L192)              │
│  │  ├─ BPE: Regex validation (L202)                │
│  │  ├─ BPF: Price extraction (L225)                │
│  │  └─ BPG: Price parsing (L227)                   │
│  │                                                  │
│  └─ ProcessMatrixProductRow()                      │
│     ├─ BPH: Product row entry (L283)               │
│     ├─ BPI: Category lookup (L305)                 │
│     └─ BPJ: Product creation (L340)                │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Response: BulkUploadSummary JSON                   │
│  {                                                  │
│    totalRows: 10,                                   │
│    successfulRows: 8,                               │
│    failedRows: 2,                                   │
│    errors: [...]                                    │
│  }                                                  │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Frontend receives response                         │
│  BP#5 hits: Can inspect errors array               │
│  Shows user success/error toast                    │
└─────────────────────────────────────────────────────┘
```

---

## Setting Breakpoints: Step by Step

### Frontend (VS Code)

1. Open `/giftusUI/lib/apiHandler.ts`
2. Click on line number **167** (red dot appears)
3. Click on line number **174** (red dot appears)
4. Click on line number **180** (red dot appears)
5. Click on line number **182** (red dot appears)
6. Click on line number **186** (red dot appears)

### Backend (VS Code)

1. Open `/giftusApi/Controllers/BulkUploadMatrixController.cs`
2. Click on line number **38** (red dot appears)
3. Click on line number **76** (red dot appears)
4. Click on line number **192** (red dot appears)
5. **Right-click** line **202** → "Add Conditional Breakpoint"
   - Condition: `!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$")`
6. Click on line number **225** (red dot appears)
7. **Right-click** line **229** → "Add Conditional Breakpoint"
   - Condition: `price < 0`
8. Click on line number **283** (red dot appears)
9. Click on line number **305** (red dot appears)
10. Click on line number **340** (red dot appears)

### Debug Flow

1. Press **F5** in VS Code
2. Select **.NET Core Debug (giftusApi)**
3. Backend starts, browser opens
4. Upload file from frontend
5. Frontend BP triggers first
6. Use **F10** to step line-by-line
7. Use **F11** to enter functions
8. Use **F5** to continue to next breakpoint
9. Backend BP triggers
10. Inspect variables in Debug view

---

## Debug Console Inspection

In Debug view console, type:

```javascript
// Frontend (Browser Console)
file; // See file object
formData; // See FormData entries (not directly visible)
response.status; // See HTTP status
response.headers; // See response headers
data; // See parsed JSON response

// Backend (Debug Console)
modelNo; // See extracted ModelNo value
priceStr; // See raw price string
priceValue; // See cleaned price value
price; // See parsed decimal price
validCategory; // See category object from database
product; // See product object before save
```
