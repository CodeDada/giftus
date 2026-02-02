# Frontend & Backend Debugging Guide for Bulk Upload

## Overview

When debugging bulk upload, you need to track the flow across:

1. **Frontend** (apiHandler.ts) - Sends file to backend
2. **Network** (Browser DevTools) - Request/response
3. **Backend** (BulkUploadMatrixController.cs) - Processes file

---

## Step 1: Frontend Debug Points (apiHandler.ts)

### Where to Set Breakpoints in `apiHandler.ts`

Open `/giftusUI/lib/apiHandler.ts` and set breakpoints at these lines:

**Line 167: Before FormData creation**

```typescript
const formData = new FormData(); // ← BREAKPOINT HERE (Line 167)
formData.append("file", file);
```

- **Why:** Inspect the `file` object - size, type, name
- **Check:** Is file the correct Excel file?

**Line 172: Before fetch call**

```typescript
const url = `${API_BASE_URL}/api/bulkupload/upload-matrix`;
console.log(`[API] Bulk Upload: Posting to ${url}`);
console.log(
  `[API] File: ${file.name}, Size: ${file.size}, Category: ${category}`,
);

const response = await fetch(url, {
  // ← BREAKPOINT HERE (Line 174-175)
  method: "POST",
  body: formData,
});
```

- **Why:** Inspect FormData before sending
- **Check:** Verify category is in FormData

**Line 180: After fetch response**

```typescript
console.log(`[API] Bulk Upload Response status: ${response.status}`);

if (!response.ok) {  // ← BREAKPOINT HERE (Line 180)
  const errorText = await response.text();
```

- **Why:** Check if backend returned error
- **Check:** response.status (200=success, 400=bad request, 500=server error)

**Line 182: Read error response**

```typescript
if (!response.ok) {
  const errorText = await response.text();  // ← BREAKPOINT HERE (Line 182)
  console.error(`[API] Bulk Upload Error response:`, errorText);
```

- **Why:** See exact error message from backend
- **Check:** Error messages (validation failures, category not found, etc.)

**Line 186: Successful response**

```typescript
const data: BulkUploadSummary = await response.json(); // ← BREAKPOINT HERE (Line 186)
console.log(`[API] Bulk Upload Response data:`, data);
```

- **Why:** Inspect the summary response
- **Check:** totalRows, successfulRows, failedRows, errors array

---

## Step 2: Frontend Function Call (in page.tsx)

Find where `uploadBulkMatrixFile` is called in `/giftusUI/app/admin/bulk-upload-new/page.tsx`:

**Look for:**

```typescript
const response = await uploadBulkMatrixFile(file, selectedCategory);
```

Set breakpoint BEFORE and AFTER this call:

**Before call:**

```typescript
if (!selectedCategory) {
  toast.error("Please select a category");
  return;
}

// ← BREAKPOINT HERE - Before API call
const response = await uploadBulkMatrixFile(file, selectedCategory);
```

- **Check:** selectedCategory value
- **Check:** file object

**After call:**

```typescript
const response = await uploadBulkMatrixFile(file, selectedCategory); // Returns here

// ← BREAKPOINT HERE - After API call
console.log("Upload response:", response);
if (response.failedRows > 0) {
  response.errors.forEach((err) => console.error(err));
}
```

- **Check:** response.totalRows, response.successfulRows, response.failedRows
- **Check:** response.errors array contents

---

## Step 3: Backend Debug Points (BulkUploadMatrixController.cs)

### Endpoint Entry Point

**Line 38: Controller action receives request**

```csharp
[HttpPost("upload-matrix")]
public async Task<ActionResult> UploadBulkMatrixData(
  [FromForm] IFormFile file,  // ← BREAKPOINT HERE
  [FromForm] string category = "")
{
```

- **Why:** Verify backend received file and category
- **Check:** file != null, file.FileName, file.Length, category value

### Category Validation

**Line 76-86: Category validation**

```csharp
if (!string.IsNullOrEmpty(category))
{
  var validCategory = await _dbContext.Categories.FirstOrDefaultAsync(c =>  // ← BREAKPOINT HERE
    EF.Functions.Like(c.Name, category.Replace("_", " ")) ||
    EF.Functions.Like(c.Name, category));

  if (validCategory == null)  // ← CONDITIONAL BREAKPOINT: validCategory == null
  {
    summary.Errors.Add($"Invalid category selected: {category}");
    return summary;
  }
}
```

- **Why:** Check if category exists in database
- **Check:** validCategory object
- **Check:** Database has expected categories

### Excel Processing Start

**Line 103-107: Opening Excel file**

```csharp
using (var package = new ExcelPackage(new FileInfo(tempFilePath)))
{
  if (package.Workbook.Worksheets.Count == 0)  // ← BREAKPOINT HERE
    throw new InvalidOperationException("Excel file contains no worksheets");

  var worksheet = package.Workbook.Worksheets[0];
  var rowCount = worksheet.Dimension?.Rows ?? 0;  // ← BREAKPOINT HERE
}
```

- **Why:** Verify Excel file structure
- **Check:** Number of sheets, row count

### Cell Data Extraction

**Line 192-205: Extracting ModelNo from cell**

```csharp
private MatrixProductData ExtractProductData(ExcelWorksheet worksheet, int startRow, int startCol)
{
  var modelNo = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim();  // ← BREAKPOINT HERE

  _logger.LogInformation($"[DEBUG] ModelNo extracted: [{modelNo}]");

  if (string.IsNullOrEmpty(modelNo))
    throw new ArgumentException("ModelNo is required");

  if (!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$"))  // ← BREAKPOINT HERE
  {
    _logger.LogError($"[DEBUG] Regex validation failed for ModelNo=[{modelNo}]");
    throw new ArgumentException($"Invalid product SKU format: '{modelNo}'...");
  }
}
```

- **Why:** See what data is being read from Excel cells
- **Check:** Actual cell value vs expected value
- **Check:** Special characters or Unicode issues

### Price Extraction

**Line 225-230: Price parsing**

```csharp
var priceStr = worksheet.Cells[startRow, startCol + 4].Value?.ToString()?.Trim() ?? "0";  // ← BREAKPOINT HERE

var priceValue = ExtractPrice(priceStr);  // ← STEP INTO
if (!decimal.TryParse(priceValue, out var price))  // ← BREAKPOINT HERE
  price = 0;

if (price < 0)  // ← CONDITIONAL BREAKPOINT: price < 0
  throw new ArgumentException($"Price must be a non-negative number, got: {price}");
```

- **Why:** Debug price parsing issues
- **Check:** Raw priceStr value (e.g., "Rs. 1,500")
- **Check:** Parsed priceValue (e.g., "1500")
- **Check:** Final decimal price

### Product Row Processing

**Line 283: Start processing a product**

```csharp
private async Task ProcessMatrixProductRow(
  MatrixProductData data,
  string uploadPath,
  BulkUploadSummary summary,
  string selectedCategory = "")  // ← BREAKPOINT HERE
{
  _logger.LogInformation($"[DEBUG] Processing: ModelNo={data.ModelNo}, Price={data.Price}, Category={selectedCategory}");
}
```

- **Why:** Verify data before database operation
- **Check:** All product data is valid
- **Check:** Category parameter received

### Database Operations

**Line 305-320: Category lookup/creation**

```csharp
var category = await _dbContext.Categories
  .FirstOrDefaultAsync(c =>  // ← BREAKPOINT HERE
    EF.Functions.Like(c.Name, selectedCategory.Replace("_", " ")) ||
    EF.Functions.Like(c.Name, selectedCategory));

if (category == null)  // ← CONDITIONAL BREAKPOINT: category == null
{
  category = new Category  // ← BREAKPOINT HERE - Creating new category
  {
    Name = categoryName,
    Slug = categoryName.ToLower().Replace(" ", "-"),
    IsActive = true,
    CreatedAt = DateTime.UtcNow
  };
  _dbContext.Categories.Add(category);
  await _dbContext.SaveChangesAsync();  // ← BREAKPOINT HERE - Saving
}
```

- **Why:** Track category creation/retrieval
- **Check:** Database contains expected categories
- **Check:** New categories are created correctly

### Product Creation

**Line 340-350: Creating product record**

```csharp
var product = new Product  // ← BREAKPOINT HERE
{
  CategoryId = category.Id,
  ModelNo = data.ModelNo,
  Name = productName,
  Slug = slug,
  ShortDescription = $"Size: {data.Size}",
  GstPercent = data.GstPercent,
  IsCustomizable = false,
  IsActive = true,
  CreatedAt = DateTime.UtcNow
};
_dbContext.Products.Add(product);
await _dbContext.SaveChangesAsync();  // ← BREAKPOINT HERE - Saving product
```

- **Why:** Verify product data before saving
- **Check:** All required fields are set
- **Check:** CategoryId is valid

---

## Full Debug Workflow

### 1. **Set Frontend Breakpoints**

```
apiHandler.ts:167  - FormData creation
apiHandler.ts:174  - Before fetch
apiHandler.ts:180  - After response
page.tsx:XX        - Before uploadBulkMatrixFile call
page.tsx:YY        - After uploadBulkMatrixFile call
```

### 2. **Set Backend Breakpoints**

```
Controller:38      - UploadBulkMatrixData entry
Controller:76      - Category validation
Controller:192     - ModelNo extraction
Controller:202     - Regex validation
Controller:225     - Price extraction
Controller:283     - ProcessMatrixProductRow entry
Controller:305     - Category lookup
Controller:340     - Product creation
```

### 3. **Start Debugging**

- Press `F5` to start VS Code debugger
- Select `.NET Core Debug (giftusApi)`
- Backend starts, frontend runs separately

### 4. **Open Browser DevTools**

- `F12` to open DevTools
- Go to Console tab
- Go to Network tab
- Go to Sources tab

### 5. **Upload File**

- Frontend pauses at first breakpoint
- Use F10 to step through FormData creation
- Use F11 to enter uploadBulkMatrixFile function
- Press F5 to continue to next breakpoint
- Check Network tab to see POST request

### 6. **Backend Hit**

- Backend breakpoint hits at Controller entry
- Inspect file and category parameters
- Use F10/F11 to step through cell extraction
- Watch for validation errors in Debug Console

### 7. **Check Response**

- Frontend breakpoint hits after fetch response
- Inspect response.status and response data
- If errors, check response.errors array in Debug Console

---

## Common Debug Scenarios

### Scenario 1: "Invalid product SKU format" Error

**Debug Flow:**

```
1. Frontend: Set breakpoint at line 167 (FormData)
   → Check file name and size

2. Frontend: Set breakpoint at line 174 (Before fetch)
   → Check formData contains file and category

3. Backend: Set breakpoint at line 192 (ModelNo extraction)
   → Step F10 to see modelNo value
   → Check for special characters

4. Backend: Set breakpoint at line 202 (Regex validation)
   → Type in Debug Console: modelNo
   → See actual value extracted

5. Backend: Check Debug Console output
   → Shows [DEBUG] ModelNo extracted: [value]
   → Shows [DEBUG] Regex validation failed: [value]
```

### Scenario 2: "Category Not Found" Error

**Debug Flow:**

```
1. Frontend: Check selectedCategory value before send
2. Backend: Line 76-86, set breakpoint at database query
3. Debug Console: Type validCategory to inspect
4. Check database: Categories table has the category name?
5. Check category name format: Match exactly or use LIKE?
```

### Scenario 3: "Price must be positive" Error

**Debug Flow:**

```
1. Backend: Line 225, breakpoint before price extraction
   → Debug Console: priceStr (shows "Rs. 1,500")

2. Step F11 into ExtractPrice() method
   → See regex replacement steps
   → Check final cleaned value

3. Line 227, breakpoint after TryParse
   → Debug Console: price (shows parsed decimal)
   → Debug Console: priceValue (shows cleaned string)

4. Line 229, conditional breakpoint: price < 0
   → Only breaks if price is negative
```

---

## Browser DevTools Network Tab

When debugging bulk upload:

1. **Open DevTools**: F12
2. **Network Tab**: Click Network tab
3. **Upload File**: Select and upload
4. **Find Request**: Look for POST `/api/bulkupload/upload-matrix`
5. **Inspect Details**:
   - **Headers**: Shows Content-Type: multipart/form-data
   - **Request Payload**: Shows file and category FormData
   - **Response**: Shows JSON summary (totalRows, errors, etc.)

---

## Browser Console Debug Output

The apiHandler.ts logs to console:

```javascript
[API Handler] API_BASE_URL: http://localhost:5056
[API] Bulk Upload: Posting to http://localhost:5056/api/bulkupload/upload-matrix
[API] File: WOODEN & METAL TROPHY CATLOUGE 2025.xlsx, Size: 40749412, Category: WOODEN_METAL_TROPHY
[API] Bulk Upload Response status: 200
[API] Bulk Upload Response data: {totalRows: 10, successfulRows: 8, failedRows: 2, errors: [...]}
```

---

## Tips

1. **Use Conditional Breakpoints** - Don't break on every iteration
   - Example: `modelNo.Length > 50` (break on suspicious long names)
   - Example: `price < 0` (break on negative prices)

2. **Use Logpoints Instead of console.log**
   - Right-click breakpoint line → Edit Logpoint
   - Message: `ModelNo: {modelNo}, Price: {price}`
   - No need to pause execution

3. **Check Debug Console**
   - Backend logs show `[DEBUG]` messages
   - Frontend logs show `[API]` messages
   - Both help track the flow

4. **Use Watch Expressions**
   - Add to Debug view: `modelNo`, `category`, `response.status`
   - Watches these throughout debug session

5. **Save Breakpoint Configurations**
   - Once set, VS Code remembers breakpoints
   - Next debug session, same breakpoints are active
