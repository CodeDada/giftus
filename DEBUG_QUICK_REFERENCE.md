# Debug Quick Reference Card

## Quick Start

1. Press `F5` to start debugging
2. Select configuration: `.NET Core Debug (giftusApi)`
3. Browser opens at `http://localhost:5056`
4. Upload file from frontend
5. Debugger pauses at breakpoints

## Keyboard Shortcuts

| Action                     | Shortcut      |
| -------------------------- | ------------- |
| Start/Continue Debugging   | F5            |
| Stop Debugging             | Shift+F5      |
| Restart Debugging          | Ctrl+Shift+F5 |
| Step Over (current line)   | F10           |
| Step Into (enter function) | F11           |
| Step Out (exit function)   | Shift+F11     |
| Toggle Breakpoint          | Ctrl+K Ctrl+B |
| Run to Cursor              | Ctrl+F10      |
| Evaluate Expression        | Ctrl+Alt+E    |
| Debug Console              | Ctrl+Shift+Y  |

## Setting Breakpoints

**Normal Breakpoint:**

```csharp
// Click on line number (before execution)
var modelNo = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim();
// Red dot appears on line number
```

**Conditional Breakpoint:**

```csharp
// Right-click line number → Add Conditional Breakpoint
// Condition: modelNo.Length > 50
var modelNo = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim();
```

**Logpoint (logs without stopping):**

```csharp
// Right-click line number → Add Logpoint
// Message: [DEBUG] ModelNo={modelNo}, Price={price}
var price = ExtractPrice(priceStr);
```

## Debug Console Commands

```javascript
// Evaluate variables and expressions
modelNo;
price;
modelNo?.Length;
worksheet.Cells[(1, 2)].Value;
product.Name;

// Call methods
product.GetPrice();
Math.Round(price, 2);
```

## Debugging Bulk Upload

### Step 1: Set Breakpoints

- Line 192: Extract ModelNo
- Line 202: Before regex validation
- Line 210: After price extraction

### Step 2: Start Debugging

- Press F5
- Select `.NET Core Debug (giftusApi)`

### Step 3: Upload File

- Frontend: Select category
- Upload Excel file
- Debugger pauses at first breakpoint

### Step 4: Inspect Data

- Variables view: See cell contents
- Debug console: Type `modelNo` to see value
- Hover: Over variables for quick peek

### Step 5: Step Through

- F10: Execute line by line
- F11: Enter function to debug internals
- Check regex match, parse results

### Step 6: Find Issues

- If validation fails: Check cell value for special chars
- If price is 0: Check price parsing logic
- If category fails: Check database query

## Common Debugging Patterns

### Debug Loop

```csharp
// Set breakpoint before loop
while (currentRow <= rowCount)  // BREAKPOINT HERE
{
    // F10 repeatedly to iterate
    // Watch loop counter and current row data
    currentRow++;
}
```

### Debug Function Call

```csharp
// Set breakpoint at function start
var result = ExtractProductData(worksheet, row, col);  // F11 to enter
// Now inside function, use F10 to step through
```

### Debug Validation

```csharp
// Set conditional breakpoint
if (!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$"))  // CONDITIONAL: validation failed
{
    // Only breaks when condition is true
    throw new ArgumentException("Invalid SKU");
}
```

## Viewing Variables

### Variables Pane

- **Locals:** Variables in current scope
- **Statics:** Class-level variables
- **Watch:** Custom expressions

### Inspecting Objects

```csharp
// In Variables pane, expand to see properties:
product
├── Id
├── Name
├── ModelNo
├── CategoryId
├── Price
└── CreatedAt

// In Debug Console:
product.Name
product.CategoryId
```

### Inspecting Collections

```csharp
// Expand in Variables pane to see items
errors
├── [0] "Invalid product SKU format"
├── [1] "Missing required field"

// In Debug Console:
errors.Count
errors[0]
errors.First()
```

## Workflow Tips

1. **Use F10 to browse data** - Don't Step Into every function
2. **Set conditional breakpoints** - Avoid breaking 1000 times in loop
3. **Use Watch expressions** - Monitor key values throughout debug
4. **Check Debug Console** - Type variable names to inspect
5. **Use Logpoints** - Log without modifying code structure

## Troubleshooting

| Problem                        | Solution                                       |
| ------------------------------ | ---------------------------------------------- |
| Breakpoint not hit             | Build in Debug mode, check line is executable  |
| Variable shows "Not Available" | Set breakpoint at variable assignment          |
| Debugger won't start           | Restart VS Code, check launch.json syntax      |
| Can't attach to process        | Ensure backend is running (`dotnet run`)       |
| Slow debugging                 | Use F10 (step over) instead of F11 (step into) |

## File Locations

```
.vscode/
├── launch.json          # Debug configurations
├── tasks.json           # Build/run tasks
└── settings.json        # Debug settings

DEBUGGING_GUIDE.md       # Full debugging documentation
DEBUG_QUICK_REFERENCE.md # This file
```

## Related Files

- **BulkUploadMatrixController.cs** - Main debug target
  - Line 192-205: Data extraction and validation
  - Line 230-250: Price/GST parsing
  - Line 280-320: Product creation

- **ExtractProductData** - Method to debug
  - Reads Excel cells
  - Validates data
  - Returns product data

- **ProcessMatrixProductRow** - Database operations
  - Category lookup
  - Product creation
  - Image download
