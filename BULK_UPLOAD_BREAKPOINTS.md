# Bulk Upload API - Debug Breakpoints Summary

## Quick Answer: Where to Set Debug Points

### **Frontend: apiHandler.ts** (5 breakpoints)

| BP #   | Line | Location                                                | What to Check                        |
| ------ | ---- | ------------------------------------------------------- | ------------------------------------ |
| **#1** | 167  | `const formData = new FormData()`                       | File name, size, type                |
| **#2** | 174  | `const response = await fetch(url, {`                   | FormData has file + category         |
| **#3** | 180  | `console.log(\`[API] Response status:`                  | HTTP status (200 = OK)               |
| **#4** | 182  | `const errorText = await response.text()`               | Error message from backend           |
| **#5** | 186  | `const data: BulkUploadSummary = await response.json()` | Response summary (totalRows, errors) |

### **Backend: BulkUploadMatrixController.cs** (10 breakpoints)

| BP #  | Line | Location                                                                           | What to Check                           | Type                                                           |
| ----- | ---- | ---------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| **A** | 38   | `public async Task<ActionResult> UploadBulkMatrixData(`                            | file object, category value             | Normal                                                         |
| **B** | 76   | `var validCategory = await _dbContext.Categories`                                  | Category exists in database             | Conditional: `validCategory == null`                           |
| **C** | 103  | `if (package.Workbook.Worksheets.Count == 0)`                                      | Excel has worksheets                    | Normal                                                         |
| **D** | 107  | `var rowCount = worksheet.Dimension?.Rows ?? 0`                                    | Excel row count                         | Normal                                                         |
| **E** | 192  | `var modelNo = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim()`  | Raw ModelNo from cell                   | Normal                                                         |
| **F** | 202  | `if (!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$"))`                             | Validation fails (has invalid chars)    | Conditional: `!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$")` |
| **G** | 225  | `var priceStr = worksheet.Cells[startRow, startCol + 4].Value?.ToString()?.Trim()` | Raw price string from cell              | Normal                                                         |
| **H** | 227  | `if (!decimal.TryParse(priceValue, out var price))`                                | Price parsed correctly                  | Conditional: `price < 0`                                       |
| **I** | 283  | `private async Task ProcessMatrixProductRow(`                                      | All product data before DB operation    | Normal                                                         |
| **J** | 305  | `var category = await _dbContext.Categories`                                       | Category lookup before product creation | Normal                                                         |

---

## Start Debugging: 3 Steps

### **Step 1: Set Breakpoints**

**Frontend breakpoints** (in `/giftusUI/lib/apiHandler.ts`):

```
Click line numbers: 167, 174, 180, 182, 186
```

**Backend breakpoints** (in `/giftusApi/Controllers/BulkUploadMatrixController.cs`):

```
Click line numbers: 38, 76, 103, 107, 192, 225, 283, 305
Right-click line 202: Add Conditional → !Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$")
Right-click line 229: Add Conditional → price < 0
```

### **Step 2: Start Debugging**

Press `F5` in VS Code → Select `.NET Core Debug (giftusApi)` → Wait for browser to open

### **Step 3: Upload File**

1. Open browser at `http://localhost:3000/admin/bulk-upload-new`
2. Select category (e.g., "WOODEN & METAL TROPHY")
3. Upload Excel file
4. Frontend BP#1 hits → Pause here
5. Use keyboard:
   - `F5` = Continue to next breakpoint
   - `F10` = Step over line
   - `F11` = Step into function
   - `Shift+F11` = Step out of function

---

## Debugging Common Errors

### Error: "Invalid product SKU format"

**Root Cause:** ModelNo contains invalid characters

**Debug Steps:**

1. Set BP at line 192 (ModelNo extraction)
2. Press F5 to continue when BP hits
3. In Debug Console, type: `modelNo`
4. See exact value (e.g., "NWD–1" with Unicode dash)
5. Check regex pattern accepts it
6. Fix Excel or regex

**Quick Check:**

- Go to Backend BP F (line 202)
- Print value to console: `_logger.LogInformation($"[DEBUG] ModelNo=[{modelNo}]");`
- Check output in backend console

---

### Error: "Missing required field: Product Name"

**Root Cause:** Product name is empty or not set correctly

**Debug Steps:**

1. Backend BP E: Line 192 (Extract ModelNo)
2. Check if ModelNo is extracted correctly
3. In ExtractProductData, check Size extraction too
4. Follow code to ProcessMatrixProductRow
5. Check product name generation logic

---

### Error: "Price must be positive number"

**Root Cause:** Price is negative or not parsing correctly

**Debug Steps:**

1. Backend BP G: Line 225 (Price extraction)
2. Step into ExtractPrice() function (F11)
3. Debug Console: `priceStr` (see raw value)
4. Debug Console: `priceValue` (see cleaned value)
5. Back at line 227, check: `price` (final parsed value)
6. If price is negative, regex replacement is failing

**Example:**

```
priceStr = "Rs. -1,500"  (Bad: negative price)
priceStr = "Rs. 1,500"   (Good: normal price)
```

---

### Error: "Category not found" or "Invalid category"

**Root Cause:** Category doesn't match database entry

**Debug Steps:**

1. Frontend BP#2: Line 174, check `category` variable
2. Frontend BP#5: Line 186, inspect `data.errors` array
3. Backend BP B: Line 76 (Category lookup)
4. Debug Console: `validCategory` (null = not found)
5. Debug Console: `c.Name` values in database
6. Check exact spelling/format matches

---

## Browser DevTools Network Inspection

1. Open DevTools: `F12`
2. Click `Network` tab
3. Upload file
4. Look for POST request to `/api/bulkupload/upload-matrix`
5. Click it, inspect:
   - **Headers**: Request/response headers
   - **Payload**: Form data sent (file + category)
   - **Response**: JSON response with summary

---

## Backend Console Logs

When debugging, backend prints:

```
[DEBUG] ExtractProductData - startRow=2, startCol=2, Cell value=[NWD-1]
[DEBUG] Regex validation failed for ModelNo=[NWD–1]    (Note: Unicode dash)
[DEBUG] Process: ModelNo=NWD-1, Price=1500, Category=WOODEN_METAL_TROPHY
```

Check these logs to track data flow.

---

## Typical Debug Session Flow

```
1. Press F5 → Select .NET Core Debug → Backend starts, browser opens

2. Upload file → Frontend BP#1 hits (line 167)
   Action: Inspect `file` object
   Command: `file.name` in Debug Console

3. Press F5 → Frontend BP#2 hits (line 174)
   Action: Check FormData
   Command: Step F10 through FormData.append() calls

4. Press F5 → Frontend BP#3 hits (line 180)
   Action: Check HTTP status
   Command: Type `response.status` → Should be 200

5. Request goes to backend → Backend BP A hits (line 38)
   Action: Inspect `file` and `category` parameters
   Command: Type `file.FileName` and `category`

6. Backend BP E hits (line 192)
   Action: See what's being extracted from Excel
   Command: Type `modelNo` → See actual cell value

7. Backend BP F conditional hits (line 202)
   Action: Found invalid character!
   Command: Type `modelNo` → Check for special chars

8. BackendBP G hits (line 225)
   Action: Check price parsing
   Command: Type `priceStr` → See raw value

9. Request returns to frontend → Frontend BP#5 hits (line 186)
   Action: See final response
   Command: Type `data` → Inspect summary

10. Upload either succeeds or shows errors
    Check: `data.errors` array for failure reasons
```

---

## Tips for Efficient Debugging

1. **Don't set too many breakpoints** - Start with 3-5 key ones
2. **Use conditional breakpoints** - Break only on errors
3. **Use Logpoints** - Right-click → "Add Logpoint" instead of breaking
4. **Read console output** - Backend logs show exact data extracted
5. **Inspect one variable at a time** - Type in Debug Console
6. **Step line by line (F10)** - Don't always step into (F11)
7. **Use Watch view** - Add expressions to monitor throughout session

---

## Files to Edit When Debugging

**Frontend:**

- `/giftusUI/app/admin/bulk-upload-new/page.tsx` - UI component
- `/giftusUI/lib/apiHandler.ts` - API call (where to debug)

**Backend:**

- `/giftusApi/Controllers/BulkUploadMatrixController.cs` - Main logic
- `/giftusApi/Models/BulkUploadSummary.cs` - Response model
- `/giftusApi/Data/GiftusDbContext.cs` - Database context

---

## Quick Reference: Keyboard Shortcuts

| Action         | Shortcut         |
| -------------- | ---------------- |
| Start/Continue | F5               |
| Pause          | Ctrl+Alt+Break   |
| Step Over      | F10              |
| Step Into      | F11              |
| Step Out       | Shift+F11        |
| Restart Debug  | Ctrl+Shift+F5    |
| Stop Debug     | Shift+F5         |
| Run to Cursor  | Ctrl+F10         |
| Toggle BP      | Ctrl+K Ctrl+B    |
| Condition BP   | Right-click line |
| Debug Console  | Ctrl+Shift+Y     |

---

## Next: Run It

Ready to debug? Follow these steps:

1. **Build backend**: `Terminal → Run Task → build-giftusapi`
2. **Set breakpoints** (see table above)
3. **Start debug**: Press `F5` → Select `.NET Core Debug (giftusApi)`
4. **Frontend**: Upload file → Watch breakpoints trigger
5. **Inspect**: Use Debug Console to check variables
6. **Step through**: Use F10/F11 to move through code
7. **Find issue**: Check error messages and data values

Good luck debugging! 🎯
