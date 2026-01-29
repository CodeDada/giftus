using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using giftusApi.Data;
using giftusApi.Models;
using OfficeOpenXml;
using System.Text.RegularExpressions;

namespace giftusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BulkUploadMatrixController : ControllerBase
{
    private readonly GiftusDbContext _dbContext;
    private readonly ILogger<BulkUploadMatrixController> _logger;
    private readonly IWebHostEnvironment _environment;
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB
    private const string UploadFolderName = "resources/images";

    public BulkUploadMatrixController(
        GiftusDbContext dbContext,
        ILogger<BulkUploadMatrixController> logger,
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
    public async Task<ActionResult> UploadBulkMatrixData([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided" });

            if (file.Length > MaxFileSize)
                return BadRequest(new { error = $"File size exceeds {MaxFileSize / (1024 * 1024)} MB limit" });

            if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
                return BadRequest(new { error = "Only Excel files (.xlsx, .xls) are supported" });

            var result = await ProcessMatrixExcelFile(file);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading bulk matrix data");
            return StatusCode(500, new { error = "Failed to process bulk upload", detail = ex.Message });
        }
    }

    private async Task<object> ProcessMatrixExcelFile(IFormFile file)
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

        var tempFilePath = Path.Combine(Path.GetTempPath(), file.FileName);
        using (var stream = new FileStream(tempFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        try
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using (var package = new ExcelPackage(new FileInfo(tempFilePath)))
            {
                if (package.Workbook.Worksheets.Count == 0)
                    throw new InvalidOperationException("Excel file contains no worksheets");

                var worksheet = package.Workbook.Worksheets[0];
                var rowCount = worksheet.Dimension?.Rows ?? 0;

                if (rowCount < 2)
                    throw new InvalidOperationException("Excel file is empty");

                // Process matrix format: 2 products per row, 3 rows per product, 1 empty row separator
                // Start from row 2 (row 1 is headers)
                int currentRow = 2;

                while (currentRow <= rowCount)
                {
                    // Check if we have data in this row
                    var modelNo1 = worksheet.Cells[currentRow, 3].Value?.ToString()?.Trim(); // Column C
                    var modelNo2 = worksheet.Cells[currentRow, 11].Value?.ToString()?.Trim(); // Column K

                    if (string.IsNullOrEmpty(modelNo1) && string.IsNullOrEmpty(modelNo2))
                    {
                        // Skip empty rows
                        currentRow++;
                        continue;
                    }

                    // Process product 1 (columns B-H, rows currentRow to currentRow+2)
                    if (!string.IsNullOrEmpty(modelNo1))
                    {
                        try
                        {
                            var productData1 = ExtractProductData(worksheet, currentRow, 2); // Column B=2
                            await ProcessMatrixProductRow(productData1, uploadPath, summary);
                            summary.SuccessfulRows++;
                        }
                        catch (Exception ex)
                        {
                            summary.FailedRows++;
                            summary.Errors.Add($"Product 1 (Row {currentRow}, ModelNo {modelNo1}): {ex.Message}");
                            _logger.LogError(ex, "Error processing product 1 at row {Row}", currentRow);
                        }
                    }

                    // Process product 2 (columns J-P, rows currentRow to currentRow+2)
                    if (!string.IsNullOrEmpty(modelNo2))
                    {
                        try
                        {
                            var productData2 = ExtractProductData(worksheet, currentRow, 10); // Column J=10
                            await ProcessMatrixProductRow(productData2, uploadPath, summary);
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

                    // Move to next product row (3 data rows + 1 separator row = 4 rows total)
                    currentRow += 4;
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
        // Extract data from 3 rows starting at startRow, starting at startCol
        // Columns: Image, ModelNo, Size, Qty, Price, Links, HSN/GST
        
        var modelNo = worksheet.Cells[startRow, startCol + 1].Value?.ToString()?.Trim() 
            ?? throw new ArgumentException("ModelNo is required");
        
        var size = worksheet.Cells[startRow, startCol + 2].Value?.ToString()?.Trim() 
            ?? throw new ArgumentException("Size is required");
        
        var qtyStr = worksheet.Cells[startRow, startCol + 3].Value?.ToString()?.Trim() ?? "0";
        var priceStr = worksheet.Cells[startRow, startCol + 4].Value?.ToString()?.Trim() ?? "0";
        var imageUrl = worksheet.Cells[startRow + 1, startCol].Value?.ToString()?.Trim() ?? "";
        var links = worksheet.Cells[startRow, startCol + 5].Value?.ToString()?.Trim() ?? "";
        var hsnGst = worksheet.Cells[startRow, startCol + 6].Value?.ToString()?.Trim() ?? "";

        // Parse quantity
        if (!int.TryParse(qtyStr, out var qty))
            qty = 0;

        // Parse price - remove "Rs." and currency symbols
        var priceValue = ExtractPrice(priceStr);
        if (!decimal.TryParse(priceValue, out var price))
            price = 0;

        // Extract GST from HSN/GST string
        var gst = ExtractGST(hsnGst);

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

        // Remove "Rs.", commas, and other non-numeric characters (except decimal point)
        var cleaned = Regex.Replace(priceStr, @"[^\d.]", "");
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

    private async Task ProcessMatrixProductRow(MatrixProductData data, string uploadPath, BulkUploadSummary summary)
    {
        // Find or create category - use first word of ModelNo as category
        var categoryName = ExtractCategory(data.ModelNo);

        var category = await _dbContext.Categories
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

        // Check if product already exists
        var existingProduct = await _dbContext.Products
            .FirstOrDefaultAsync(p => p.ModelNo == data.ModelNo);

        Product product;
        if (existingProduct != null)
        {
            product = existingProduct;
            product.ShortDescription = $"Size: {data.Size}";
            _dbContext.Products.Update(product);
        }
        else
        {
            product = new Product
            {
                CategoryId = category.Id,
                ModelNo = data.ModelNo,
                Name = $"{categoryName} - {data.Size}",
                Slug = $"{data.ModelNo.ToLower()}-{data.Size.ToLower().Replace("\"", "in")}",
                ShortDescription = $"Size: {data.Size}",
                GstPercent = data.GstPercent,
                IsCustomizable = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Products.Add(product);
        }

        await _dbContext.SaveChangesAsync();

        // Handle image if provided
        if (!string.IsNullOrEmpty(data.ImageUrl))
        {
            try
            {
                var imageFileName = await DownloadAndStoreImage(data.ImageUrl, data.ModelNo, uploadPath);
                product.BaseImageUrl = $"/resources/images/{imageFileName}";
                _dbContext.Products.Update(product);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to download image for product {ModelNo}", data.ModelNo);
            }
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

    private async Task<string> DownloadAndStoreImage(string imageUrl, string productModelNo, string uploadPath)
    {
        using (var client = new HttpClient())
        {
            try
            {
                var response = await client.GetAsync(imageUrl);
                response.EnsureSuccessStatusCode();

                var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
                var extension = contentType.Split('/')[1];
                var fileName = $"{productModelNo}_base.{extension}";
                var filePath = Path.Combine(uploadPath, fileName);

                using (var content = await response.Content.ReadAsStreamAsync())
                {
                    using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                    {
                        await content.CopyToAsync(fileStream);
                    }
                }

                return fileName;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to download image from {imageUrl}", ex);
            }
        }
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

public class MatrixProductData
{
    public string ModelNo { get; set; } = null!;
    public string Size { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? Links { get; set; }
    public string? HsnGst { get; set; }
    public decimal GstPercent { get; set; }
}
