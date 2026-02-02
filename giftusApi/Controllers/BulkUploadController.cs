using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using giftusApi.Data;
using giftusApi.Models;
using OfficeOpenXml;
using OfficeOpenXml.Drawing;
using System.Text.RegularExpressions;
using System.IO;
using System.IO.Compression;
using System.Xml;

namespace giftusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BulkUploadController : ControllerBase
{
    private readonly GiftusDbContext _dbContext;
    private readonly ILogger<BulkUploadController> _logger;
    private readonly IWebHostEnvironment _environment;
    private const long MaxFileSize = 500 * 1024 * 1024; // 500 MB
    private const string UploadFolderName = "../resources/images"; // One level up from giftusApi to project root

    // Session-level tracking for sequential image extraction
    private List<ZipArchiveEntry>? _cachedMediaEntries = null;
    private List<byte[]>? _cachedImageData = null; // Cache actual image bytes, not entries
    private int _mediaFileIndex = 0;

    public BulkUploadController(
        GiftusDbContext dbContext,
        ILogger<BulkUploadController> logger,
        IWebHostEnvironment environment)
    {
        _dbContext = dbContext;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Upload and process Excel file with matrix format (2 products per row, 3 rows per product)
    /// Column Layout:
    /// - Product 1: B(Image), C(ModelNo), D(Size), E(Qty), F(Price), G(Links), H(HSN/GST)
    /// - Product 2: J(Image), K(ModelNo), L(Size), M(Qty), N(Price), O(Links), P(HSN/GST)
    /// - Empty row separator between product rows
    /// </summary>
    [HttpPost("upload-matrix")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> UploadBulkMatrixData([FromForm] IFormFile file, [FromForm] string category = "")
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided" });

            if (file.Length > MaxFileSize)
                return BadRequest(new { error = $"File size exceeds {MaxFileSize / (1024 * 1024)} MB limit" });

            if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
                return BadRequest(new { error = "Only Excel files (.xlsx, .xls) are supported" });

            var result = await ProcessMatrixExcelFile(file, category);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading bulk matrix data");
            return StatusCode(500, new { error = "Failed to process bulk upload", detail = ex.Message });
        }
    }

    private async Task<object> ProcessMatrixExcelFile(IFormFile file, string category = "")
    {
        var uploadPath = Path.Combine(_environment.ContentRootPath, UploadFolderName);
        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

        var summary = new BulkUploadSummary
        {
            TotalRows = 0,
            SuccessfulRows = 0,
            FailedRows = 0,
            Errors = new List<string>()
        };

        // Validate category if provided
        if (!string.IsNullOrEmpty(category))
        {
            var validCategory = await _dbContext.Categories.FirstOrDefaultAsync(c =>
                EF.Functions.Like(c.Name, category.Replace("_", " ")) ||
                EF.Functions.Like(c.Name, category));

            if (validCategory == null)
            {
                summary.Errors.Add($"Invalid category selected: {category}");
                return summary;
            }
        }

        var tempFilePath = Path.Combine(Path.GetTempPath(), file.FileName);
        using (var stream = new FileStream(tempFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        try
        {
            // Reset session-level trackers for this upload
            _cachedMediaEntries = null;
            _cachedImageData = null;
            _mediaFileIndex = 0;

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using (var package = new ExcelPackage(new FileInfo(tempFilePath)))
            {
                if (package.Workbook.Worksheets.Count == 0)
                    throw new InvalidOperationException("Excel file contains no worksheets");

                var worksheet = package.Workbook.Worksheets[0];
                var rowCount = worksheet.Dimension?.Rows ?? 0;
                var colCount = worksheet.Dimension?.Columns ?? 0;

                _logger.LogInformation($"[WORKSHEET INFO] Worksheet name: {worksheet.Name}");
                _logger.LogInformation($"[WORKSHEET INFO] Total rows: {rowCount}, Total columns: {colCount}");

                if (rowCount < 2)
                    throw new InvalidOperationException("Excel file is empty");

                // Log first 10 rows to understand structure
                _logger.LogInformation("[WORKSHEET DATA] ===== WORKSHEET CONTENT =====");
                for (int row = 1; row <= Math.Min(10, rowCount); row++)
                {
                    var rowData = new List<string>();
                    for (int col = 1; col <= Math.Min(20, colCount); col++)
                    {
                        var cellValue = worksheet.Cells[row, col].Value?.ToString() ?? "[EMPTY]";
                        rowData.Add($"Col{col}:{cellValue}");
                    }
                    _logger.LogInformation($"[WORKSHEET DATA] Row {row}: {string.Join(" | ", rowData)}");
                }
                _logger.LogInformation("[WORKSHEET DATA] ===== END WORKSHEET CONTENT =====");

                // Process matrix format: 2 products per row, 3 rows per product block (ModelNo, Details, Empty)
                // Start from row 2 (row 1 is headers)
                int currentRow = 2;

                while (currentRow <= rowCount)
                {
                    // Check if we have data in this row (ModelNo row)
                    var modelNo1 = worksheet.Cells[currentRow, 3].Value?.ToString()?.Trim(); // Column C
                    var modelNo2 = worksheet.Cells[currentRow, 11].Value?.ToString()?.Trim(); // Column K

                    if (string.IsNullOrEmpty(modelNo1) && string.IsNullOrEmpty(modelNo2))
                    {
                        // Skip empty rows
                        currentRow++;
                        continue;
                    }

                    // Process product 1 (columns B-H, rows currentRow to currentRow+1)
                    if (!string.IsNullOrEmpty(modelNo1))
                    {
                        try
                        {
                            var productData1 = ExtractProductData(worksheet, currentRow, 2); // Column B=2
                            await ProcessMatrixProductRow(productData1, worksheet, currentRow + 1, 2, uploadPath, summary, category, tempFilePath);
                            summary.SuccessfulRows++;
                        }
                        catch (Exception ex)
                        {
                            summary.FailedRows++;
                            summary.Errors.Add($"Product 1 (Row {currentRow}, ModelNo {modelNo1}): {ex.Message}");
                            _logger.LogError(ex, "Error processing product 1 at row {Row}", currentRow);
                        }
                    }

                    // Process product 2 (columns J-P, rows currentRow to currentRow+1)
                    if (!string.IsNullOrEmpty(modelNo2))
                    {
                        try
                        {
                            var productData2 = ExtractProductData(worksheet, currentRow, 10); // Column J=10
                            await ProcessMatrixProductRow(productData2, worksheet, currentRow + 1, 10, uploadPath, summary, category, tempFilePath);
                            summary.SuccessfulRows++;
                        }
                        catch (Exception ex)
                        {
                            summary.FailedRows++;
                            summary.Errors.Add($"Product 2 (Row {currentRow}, ModelNo {modelNo2}): {ex.Message}");
                            _logger.LogError(ex, "Error processing product 2 at row {Row}", currentRow);
                        }
                    }

                    summary.TotalRows += (string.IsNullOrEmpty(modelNo1) ? 0 : 1) + (string.IsNullOrEmpty(modelNo2) ? 0 : 1);

                    // Move to next product row (1 ModelNo row + 1 detail row + 1 separator row = 3 rows total)
                    currentRow += 3;
                }

                await _dbContext.SaveChangesAsync();
            }
        }
        finally
        {
            if (System.IO.File.Exists(tempFilePath))
                System.IO.File.Delete(tempFilePath);
        }

        return new
        {
            message = "Bulk matrix upload completed",
            summary = new
            {
                totalRows = summary.TotalRows,
                successfulRows = summary.SuccessfulRows,
                failedRows = summary.FailedRows,
                errors = summary.Errors
            }
        };
    }

    private MatrixProductData ExtractProductData(ExcelWorksheet worksheet, int startRow, int startCol)
    {
        // Extract data from matrix format:
        // For Product 1 (startCol=2, columns B-H):
        //   Row N, Col C (3): ModelNo
        //   Row N+1, Col D (4): Size
        //   Row N+1, Col E (5): Qty
        //   Row N+1, Col F (6): Price
        //   Row N+1, Col G (7): Links
        //   Row N+1, Col H (8): HSN/GST
        // For Product 2 (startCol=10, columns J-P):
        //   Row N, Col K (11): ModelNo
        //   Row N+1, Col L (12): Size
        //   Row N+1, Col M (13): Qty
        //   Row N+1, Col N (14): Price
        //   Row N+1, Col O (15): Links
        //   Row N+1, Col P (16): HSN/GST

        // Log all cell values we're reading
        _logger.LogInformation($"[EXTRACT] ===== EXTRACTING PRODUCT DATA =====");
        _logger.LogInformation($"[EXTRACT] startRow={startRow}, startCol={startCol}");

        // ModelNo is in current row, column startCol+1 (Col 3 or 11)
        var modelNoCell = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim();

        // Details are in NEXT row (startRow + 1)
        var detailRow = startRow + 1;
        var sizeCell = worksheet.Cells[detailRow, startCol + 2].Value?.ToString()?.Trim();  // Size in startCol+2 (Col 4 or 12)
        var qtyCell = worksheet.Cells[detailRow, startCol + 3].Value?.ToString()?.Trim();   // Qty in startCol+3 (Col 5 or 13)
        var priceCell = worksheet.Cells[detailRow, startCol + 4].Value?.ToString()?.Trim(); // Price in startCol+4 (Col 6 or 14)
        var linksCell = worksheet.Cells[detailRow, startCol + 5].Value?.ToString()?.Trim(); // Links in startCol+5 (Col 7 or 15)
        var hsnGstCell = worksheet.Cells[detailRow, startCol + 6].Value?.ToString()?.Trim();// HSN/GST in startCol+6 (Col 8 or 16)
        var imageCell = worksheet.Cells[detailRow, startCol].Value?.ToString()?.Trim();     // Image in startCol (Col 2 or 10)

        _logger.LogInformation($"[EXTRACT] ModelNo (row {startRow}, col {startCol + 1}): [{modelNoCell}]");
        _logger.LogInformation($"[EXTRACT] Size (row {detailRow}, col {startCol + 2}): [{sizeCell}]");
        _logger.LogInformation($"[EXTRACT] Qty (row {detailRow}, col {startCol + 3}): [{qtyCell}]");
        _logger.LogInformation($"[EXTRACT] Price (row {detailRow}, col {startCol + 4}): [{priceCell}]");
        _logger.LogInformation($"[EXTRACT] Links (row {detailRow}, col {startCol + 5}): [{linksCell}]");
        _logger.LogInformation($"[EXTRACT] HSN/GST (row {detailRow}, col {startCol + 6}): [{hsnGstCell}]");
        _logger.LogInformation($"[EXTRACT] Image (row {detailRow}, col {startCol}): [{imageCell}]");

        var modelNo = modelNoCell;

        // Debug logging
        _logger.LogInformation($"[DEBUG] ExtractProductData - startRow={startRow}, startCol={startCol}, ModelNo=[{modelNo}]");

        if (string.IsNullOrEmpty(modelNo))
            throw new ArgumentException("ModelNo is required");

        // Allow spaces and underscores in ModelNo - more lenient validation
        // Examples: "NWD-1", "TROPHY 1", "NWD_1", etc.
        if (!Regex.IsMatch(modelNo, @"^[A-Za-z0-9\-_\s]+$"))
        {
            _logger.LogError($"[DEBUG] Regex validation failed for ModelNo=[{modelNo}]");
            throw new ArgumentException($"Invalid product SKU format: '{modelNo}'. Use alphanumeric characters, hyphens, underscores, and spaces only (e.g., NWD-1).");
        }

        // Size can be in inches (e.g., "10"") or other formats (e.g., "Small", "Medium")
        // Keep it as-is, just trim whitespace
        var size = sizeCell?.Trim();
        if (string.IsNullOrEmpty(size))
            throw new ArgumentException("Size is required");

        var qtyStr = qtyCell ?? "0";
        var priceStr = priceCell ?? "0";
        var imageUrl = imageCell ?? "";
        var links = linksCell ?? "";
        var hsnGst = hsnGstCell ?? "";

        // Parse quantity
        if (!int.TryParse(qtyStr, out var qty))
            qty = 0;

        // Parse price - remove "Rs.", commas, and other non-numeric characters (keep decimal point)
        var priceValue = ExtractPrice(priceStr);
        if (!decimal.TryParse(priceValue, out var price))
            price = 0;

        // Validate price is non-negative
        if (price < 0)
            throw new ArgumentException($"Price must be a non-negative number, got: {price}");

        // Extract GST from HSN/GST string
        var gst = ExtractGST(hsnGst);

        _logger.LogInformation($"[EXTRACT] PARSED: ModelNo={modelNo}, Size={size}, Qty={qty}, Price={price}, GST={gst}");
        _logger.LogInformation($"[EXTRACT] ===== END EXTRACT =====");

        return new MatrixProductData
        {
            ModelNo = modelNo,
            Size = size,
            Quantity = qty,
            Price = price,
            ImageUrl = imageUrl,
            Links = links,
            HsnGst = hsnGst,
            GstPercent = gst
        };
    }

    private string ExtractPrice(string priceStr)
    {
        if (string.IsNullOrEmpty(priceStr))
            return "0";

        // Remove "Rs.", currency symbols, commas, and whitespace - keep only digits and decimal point
        // Examples: "Rs. 1,500" -> "1500", "1500.50" -> "1500.50", "Rs.1500" -> "1500"
        var cleaned = Regex.Replace(priceStr, @"[^\d.]", "");

        // If no digits found, return 0
        if (string.IsNullOrEmpty(cleaned))
            return "0";

        return cleaned;
    }

    private decimal ExtractGST(string hsnGst)
    {
        if (string.IsNullOrEmpty(hsnGst))
            return 18m; // Default GST

        // Extract number from "HSN 7018 GST 18%" format
        var match = Regex.Match(hsnGst, @"GST\s*(\d+)");
        if (match.Success && decimal.TryParse(match.Groups[1].Value, out var gst))
            return gst;

        return 18m; // Default GST
    }

    private async Task ProcessMatrixProductRow(MatrixProductData data, ExcelWorksheet worksheet, int imageRow, int imageCol, string uploadPath, BulkUploadSummary summary, string selectedCategory = "", string excelFilePath = "")
    {
        // Validate required fields
        if (string.IsNullOrEmpty(data.ModelNo))
            throw new ArgumentException("Missing required field: ModelNo");

        if (string.IsNullOrEmpty(data.Size))
            throw new ArgumentException("Missing required field: Size");

        if (data.Price < 0)
            throw new ArgumentException("Price must be a positive number");

        // Find or use selected category, or auto-generate from ModelNo
        Category category = null;

        if (!string.IsNullOrEmpty(selectedCategory))
        {
            // Use the selected category passed from frontend
            category = await _dbContext.Categories
                .FirstOrDefaultAsync(c =>
                    EF.Functions.Like(c.Name, selectedCategory.Replace("_", " ")) ||
                    EF.Functions.Like(c.Name, selectedCategory));

            if (category == null)
                throw new ArgumentException($"Invalid category: {selectedCategory}");
        }
        else
        {
            // Fallback: auto-generate category from ModelNo prefix
            var categoryName = ExtractCategory(data.ModelNo);

            category = await _dbContext.Categories
                .FirstOrDefaultAsync(c => c.Name == categoryName);

            if (category == null)
            {
                category = new Category
                {
                    Name = categoryName,
                    Slug = categoryName.ToLower().Replace(" ", "-"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Categories.Add(category);
                await _dbContext.SaveChangesAsync();
            }
        }

        // Check if product already exists
        var existingProduct = await _dbContext.Products
            .FirstOrDefaultAsync(p => p.ModelNo == data.ModelNo);

        Product product;
        if (existingProduct != null)
        {
            // Update existing product with new information
            product = existingProduct;
            product.ShortDescription = $"Size: {data.Size}";
            product.GstPercent = data.GstPercent;
            product.Quantity = data.Quantity; // Update quantity from Excel
            product.CategoryId = category.Id; // Ensure category is correct
            _logger.LogInformation($"[PRODUCT] Updating existing product: {data.ModelNo}, Qty: {data.Quantity}");
            _dbContext.Products.Update(product);
        }
        else
        {
            // Generate product name - use ModelNo if no specific name provided
            var productName = $"{data.ModelNo} - {data.Size}";

            product = new Product
            {
                CategoryId = category.Id,
                ModelNo = data.ModelNo,
                Name = productName,
                Slug = $"{data.ModelNo.ToLower()}-{data.Size.ToLower().Replace("\"", "in")}",
                ShortDescription = $"Size: {data.Size}",
                GstPercent = data.GstPercent,
                Quantity = data.Quantity, // Set quantity from Excel
                IsCustomizable = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _logger.LogInformation($"[PRODUCT] Creating new product: {data.ModelNo}");
            _dbContext.Products.Add(product);
        }

        await _dbContext.SaveChangesAsync();

        // Handle image if embedded in Excel (not a URL)
        try
        {
            var imageFileName = await ExtractAndSaveEmbeddedImage(worksheet, imageRow, imageCol, data.ModelNo, uploadPath);

            // If EPPlus method didn't work, try ZIP-based extraction
            if (string.IsNullOrEmpty(imageFileName) && !string.IsNullOrEmpty(excelFilePath))
            {
                _logger.LogInformation($"[IMAGE] EPPlus extraction failed, attempting ZIP-based extraction");
                imageFileName = await ExtractImagesFromExcelZip(excelFilePath, data.ModelNo, uploadPath);
            }

            if (!string.IsNullOrEmpty(imageFileName))
            {
                var newImageUrl = $"/resources/images/{imageFileName}";

                // Update product with new image URL
                if (product.BaseImageUrl != newImageUrl)
                {
                    product.BaseImageUrl = newImageUrl;
                    _dbContext.Products.Update(product);
                    await _dbContext.SaveChangesAsync();
                    _logger.LogInformation($"[IMAGE] Updated image for {data.ModelNo}: {imageFileName}");
                }
                else
                {
                    _logger.LogInformation($"[IMAGE] Image already saved for {data.ModelNo}: {imageFileName}");
                }
            }
            else
            {
                _logger.LogInformation($"[IMAGE] No image extracted for {data.ModelNo}");
            }
        }
        catch (Exception ex)
        {
            // Log warning but don't fail the upload if image extraction fails
            _logger.LogWarning(ex, "Warning: Failed to extract embedded image for product {ModelNo} - continuing with upload", data.ModelNo);
        }

        // Add or update variant
        var existingVariant = await _dbContext.ProductVariants
            .FirstOrDefaultAsync(v => v.ProductId == product.Id
                && v.VariantName == "Size"
                && v.VariantValue == data.Size);

        if (existingVariant != null)
        {
            existingVariant.Price = data.Price;
            existingVariant.StockQty = data.Quantity;
            _dbContext.ProductVariants.Update(existingVariant);
        }
        else
        {
            var variant = new ProductVariant
            {
                ProductId = product.Id,
                VariantName = "Size",
                VariantValue = data.Size,
                Price = data.Price,
                StockQty = data.Quantity
            };
            _dbContext.ProductVariants.Add(variant);
        }
    }

    private string ExtractCategory(string modelNo)
    {
        // Extract category from ModelNo (e.g., "NWD-1" -> "NWD", "TPHY001" -> "TPHY")
        var match = Regex.Match(modelNo, @"^([A-Z]+)");
        return match.Success ? match.Groups[1].Value : modelNo;
    }

    private async Task<string?> ExtractAndSaveEmbeddedImage(ExcelWorksheet worksheet, int row, int col, string productModelNo, string uploadPath)
    {
        try
        {
            _logger.LogInformation($"[IMAGE] Attempting to extract image for {productModelNo} at row {row}, col {col}");

            // EPPlus direct extraction is unreliable, we'll use ZIP method instead
            // This is just a placeholder that returns null to trigger ZIP extraction
            _logger.LogInformation($"[IMAGE] Skipping EPPlus extraction, will use ZIP-based method");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, $"[IMAGE] Error in ExtractAndSaveEmbeddedImage for {productModelNo}");
            return null;
        }
    }

    public async Task<string?> ExtractImagesFromExcelZip(string excelFilePath, string productModelNo, string uploadPath)
    {
        try
        {
            _logger.LogInformation($"[IMAGE-ZIP] Attempting ZIP-based extraction for {productModelNo} (Image index: {_mediaFileIndex})");

            // Excel files are ZIP archives - extract images from media folder
            using (var archive = ZipFile.OpenRead(excelFilePath))
            {
                // On first call for this upload session, cache all image data (not just entries)
                if (_cachedImageData == null)
                {
                    var mediaEntries = archive.Entries.Where(e =>
                        e.FullName.StartsWith("xl/media/", StringComparison.OrdinalIgnoreCase) &&
                        !e.FullName.EndsWith("/")) // Exclude directories
                        .OrderBy(e => e.Name) // Sort by name for consistent ordering
                        .ToList();

                    _logger.LogInformation($"[IMAGE-ZIP] Found {mediaEntries.Count} media files in Excel archive (sorted by name)");

                    // Extract and cache actual image data while archive is open
                    _cachedImageData = new List<byte[]>();
                    _cachedMediaEntries = new List<ZipArchiveEntry>();

                    foreach (var mediaEntry in mediaEntries)
                    {
                        _logger.LogInformation($"[IMAGE-ZIP]   - {mediaEntry.Name}");
                        using (var stream = mediaEntry.Open())
                        {
                            using (var ms = new MemoryStream())
                            {
                                await stream.CopyToAsync(ms);
                                byte[] extractedData = ms.ToArray();
                                if (extractedData.Length > 0)
                                {
                                    _cachedImageData.Add(extractedData);
                                    _cachedMediaEntries.Add(mediaEntry);
                                }
                            }
                        }
                    }

                    _logger.LogInformation($"[IMAGE-ZIP] Cached {_cachedImageData.Count} image files with actual data");
                }

                if (_cachedImageData == null || _cachedImageData.Count == 0)
                {
                    _logger.LogInformation($"[IMAGE-ZIP] No valid media files found in xl/media/");
                    return null;
                }

                // Check if we've run out of images
                if (_mediaFileIndex >= _cachedImageData.Count)
                {
                    _logger.LogWarning($"[IMAGE-ZIP] Requested image index {_mediaFileIndex} but only {_cachedImageData.Count} images available. Wrapping around to index 0.");
                    _mediaFileIndex = 0; // Wrap around
                }

                // Get cached image data and corresponding entry info
                byte[] selectedImageData = _cachedImageData[_mediaFileIndex];
                var selectedEntry = _cachedMediaEntries[_mediaFileIndex];

                _logger.LogInformation($"[IMAGE-ZIP] Extracting image index {_mediaFileIndex}: {selectedEntry.Name} for product {productModelNo} (size: {selectedImageData.Length} bytes)");

                // Determine extension
                string extension = DetermineImageExtension(selectedImageData);
                string originalName = Path.GetFileName(selectedEntry.Name);
                string originalExt = Path.GetExtension(originalName).TrimStart('.');
                if (!string.IsNullOrEmpty(originalExt) && originalExt.Length <= 4)
                    extension = originalExt;

                // Normalize filename: replace spaces with hyphens for cleaner URLs
                string normalizedModelNo = productModelNo.Replace(" ", "-");
                string fileName = $"{normalizedModelNo}_base.{extension}";
                string filePath = Path.Combine(uploadPath, fileName);

                await System.IO.File.WriteAllBytesAsync(filePath, selectedImageData);
                _logger.LogInformation($"[IMAGE-ZIP] Successfully saved image: {fileName} ({selectedImageData.Length} bytes) from archive entry: {selectedEntry.Name}");

                // Increment index for next product
                _mediaFileIndex++;

                return fileName;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, $"[IMAGE-ZIP] Error in ZIP-based extraction for {productModelNo}");
            return null;
        }
    }
    private string DetermineImageExtension(byte[] imageBytes)
    {
        // Check image magic bytes to determine type
        if (imageBytes.Length < 4)
            return "jpg"; // default

        // JPEG: FF D8 FF
        if (imageBytes[0] == 0xFF && imageBytes[1] == 0xD8 && imageBytes[2] == 0xFF)
            return "jpg";

        // PNG: 89 50 4E 47
        if (imageBytes[0] == 0x89 && imageBytes[1] == 0x50 && imageBytes[2] == 0x4E && imageBytes[3] == 0x47)
            return "png";

        // GIF: 47 49 46
        if (imageBytes[0] == 0x47 && imageBytes[1] == 0x49 && imageBytes[2] == 0x46)
            return "gif";

        // BMP: 42 4D
        if (imageBytes[0] == 0x42 && imageBytes[1] == 0x4D)
            return "bmp";

        return "jpg"; // default to jpg
    }

    /// <summary>
    /// Get template for matrix format Excel upload
    /// </summary>
    [HttpGet("template-matrix")]
    public ActionResult GetMatrixTemplate()
    {
        try
        {
            var templateContent = @"C	IMAGE	MODEL NO.	SIZE	Qty.	PRICE	Links	HSN / GST		IMAGE	MODEL NO.	SIZE	Qty.	PRICE	Links	HSN / GST	
		NWD-1								NWD-2						
			10""	29	Rs. 1,500		HSN 3926 GST 18%				11""	29	Rs. 1,420		HSN 3926 GST 18%	
			(Image URL here)	(Links)									(Image URL here)	(Links)									
			(Image URL here)	(Links)									(Image URL here)	(Links)									
																
		TPHY-1								CRYS-1						
			Small	50	Rs. 2,500		HSN 7018 GST 18%				Small	75	Rs. 3,200		HSN 7018 GST 18%	
			(Image URL)	(Links)									(Image URL)	(Links)									
			(Image URL)	(Links)									(Image URL)	(Links)";

            return Content(templateContent, "text/plain", System.Text.Encoding.UTF8);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating matrix template");
            return StatusCode(500, new { error = "Failed to generate template" });
        }
    }
}
