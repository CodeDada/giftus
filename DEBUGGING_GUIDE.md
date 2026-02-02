# Debugging Guide for Giftus Project

## Prerequisites

1. **VS Code Extensions Required:**
   - C# Dev Kit (ms-dotnettools.csharp)
   - .NET Runtime Install Tool (ms-dotnettools.vscode-dotnet-runtime)
   - Debugger for .NET (ms-dotnettools.debugger-for-dotnet)

2. **Install via command line:**
   ```bash
   code --install-extension ms-dotnettools.csharp
   code --install-extension ms-dotnettools.vscode-dotnet-runtime
   code --install-extension ms-dotnettools.debugger-for-dotnet
   ```

## Debug Configurations

### 1. Debug Backend API (.NET Core)

**Option A: Launch with Auto-Open Browser**

- Click **Run → Start Debugging** or press `F5`
- Select `.NET Core Debug (giftusApi)`
- Browser opens at `http://localhost:5056`
- Debugger pauses at breakpoints

**Option B: Attach to Running Process**

- Start backend manually: `dotnet run --project giftusApi/giftusApi.csproj`
- Click **Run → Start Debugging** or press `F5`
- Select `.NET Core Attach (giftusApi)`
- Choose the running dotnet process
- Debugger attaches

### 2. Debug Backend with Browser Integration

- Click **Run → Start Debugging** or press `F5`
- Select `.NET Core Debug with Browser (giftusApi)`
- Opens debugging session with Chrome DevTools integration

## Using Breakpoints

### Setting Breakpoints

1. Click on the line number in the editor (red dot appears)
2. When code reaches that line during debugging, execution pauses

### Breakpoint Types

**Normal Breakpoint:**

- Click line number
- Execution pauses at that line

**Conditional Breakpoint:**

- Right-click line number → Add Conditional Breakpoint
- Enter condition: `modelNo == null` or `price < 0`
- Pauses only when condition is true

**Hit Count Breakpoint:**

- Right-click line number → Add Conditional Breakpoint
- Use format: `%hitCount% > 5` (break after 5 hits)

**Logpoint (no break):**

- Right-click line number → Add Logpoint
- Enter message: `ModelNo: {modelNo}, Price: {price}`
- Logs to debug console without pausing

### Managing Breakpoints

- **Debug → Remove All Breakpoints**
- **Debug → Enable/Disable All Breakpoints**
- Breakpoints are listed in Debug view

## Debug Controls

Once debugging is active, use these controls:

| Control   | Shortcut      | Action                                      |
| --------- | ------------- | ------------------------------------------- |
| Continue  | F5            | Resume execution                            |
| Step Over | F10           | Execute current line, don't enter functions |
| Step Into | F11           | Enter function calls                        |
| Step Out  | Shift+F11     | Exit current function                       |
| Restart   | Ctrl+Shift+F5 | Restart debug session                       |
| Stop      | Ctrl+Shift+F5 | Stop debugging                              |

## Debug Views

### Debug Console

- View → Debug Console or `Ctrl+Shift+Y`
- Shows log output and REPL evaluation
- Type variable names to inspect values
- Example: Type `modelNo` to see its value

### Variables View

- Automatically shown in Debug view (left sidebar)
- **Local:** Variables in current scope
- **Watch:** Custom expressions to monitor
- Expand objects to inspect properties

### Call Stack

- Shows function call hierarchy
- Click frames to jump to that code
- Helps trace execution path

### Breakpoints View

- List of all set breakpoints
- Enable/disable individually
- Jump to breakpoint by clicking

## Example: Debugging Bulk Upload

### Scenario: Debugging "Invalid product SKU format" error

**Steps:**

1. **Set Breakpoint in ExtractProductData**
   - Open `giftusApi/Controllers/BulkUploadMatrixController.cs`
   - Line 195: `var modelNo = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim();`
   - Click line number to set breakpoint

2. **Set Conditional Breakpoint at Validation**
   - Line 202: Right-click → Conditional Breakpoint
   - Condition: `!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$")`
   - Only breaks when validation fails

3. **Start Debugging**
   - Press `F5`
   - Select `.NET Core Debug (giftusApi)`
   - Waits at first breakpoint

4. **Upload File**
   - Frontend: Select category and upload file
   - Backend pauses at breakpoint

5. **Inspect Values**
   - In Debug Console: type `modelNo`
   - See exact value (e.g., `"NWD-1"` or `"NWD–1"` with special chars)
   - Check Variables view for cell column/row info

6. **Step Through**
   - F10: Execute line, see regex validation
   - F11: Step into validation function
   - Hover over variables to see values

7. **Fix Issue**
   - Update regex pattern if needed
   - Or update Excel parsing logic
   - Stop debugging (Shift+F5)
   - Modify code
   - Restart debug session (Ctrl+Shift+F5)

## Common Tasks

### Debug Specific Method

1. Set breakpoint at method entry
2. Call method from frontend or API
3. Debugger pauses at breakpoint

### Inspect Object Properties

1. Hover over variable in editor
2. Or type in Debug Console: `variableName.PropertyName`
3. Or expand in Variables view

### Watch Expression

1. In Watch view (Debug sidebar), click "+"
2. Enter expression: `product.Price > 1000`
3. Updates in real-time as code executes

### Debug Performance

1. Use Step Over (F10) for fast execution
2. Use Step Into (F11) only for specific functions
3. Use Continue (F5) to skip to next breakpoint
4. Remove unused breakpoints

## Troubleshooting

### Debugger Won't Start

- Check C# Dev Kit extension is installed
- Restart VS Code
- Check .vscode/launch.json is valid JSON
- Run `dotnet build` to ensure project builds

### Breakpoints Not Hit

- Ensure code is compiled in Debug mode
- Check breakpoint is on executable line (not comment)
- Restart debugging session
- Verify correct file is open (check path)

### Variables Show "Not Available"

- Variable might be optimized away by compiler
- Try in Debug mode (not Release)
- Set breakpoint where variable is assigned
- Use Watch view instead

### Process Won't Attach

- Ensure backend is running: `dotnet run ...`
- Check process list shows `dotnet` or `giftusApi`
- Try killing and restarting backend
- Restart VS Code

## Tasks Available

Run from **Terminal → Run Task**:

- `build-giftusapi` - Build Debug version
- `build-giftusapi-release` - Build Release version
- `clean-giftusapi` - Clean build artifacts
- `restore-giftusapi` - Restore NuGet packages
- `run-giftusapi` - Run API
- `watch-giftusapi` - Run with auto-reload
- `test-giftusapi` - Run unit tests
- `npm: dev (frontend)` - Run frontend

## Tips & Best Practices

1. **Use Logpoints Instead of Console.WriteLine**
   - Logpoints auto-format and don't modify code
   - Easier to manage vs littering code with logs

2. **Set Breakpoint at Loop Start**
   - Iterate through loop with F10
   - Watch loop variables change

3. **Conditional Breakpoints for Edge Cases**
   - Break only on null, empty, or specific values
   - Avoids breaking on every iteration

4. **Use Watch Expressions**
   - Monitor complex expressions throughout debug session
   - Better than repeatedly typing in console

5. **Debug Compound Problems**
   - Use Run → Debug Backend + Frontend
   - Debug both systems simultaneously
   - Check API communication in Network tab

6. **Clean Before Debugging**
   - If behavior seems wrong, run: Terminal → Run Task → `clean-giftusapi`
   - Then rebuild
   - Clears stale compiled code

## Resources

- [VS Code C# Debugging](https://code.visualstudio.com/docs/csharp/debugging)
- [.NET Core Debugging](https://github.com/dotnet/vscode-csharp/wiki/Debugging)
- [OmniSharp Documentation](https://www.omnisharp.net/)
