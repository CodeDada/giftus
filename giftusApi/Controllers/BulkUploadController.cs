using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using giftusApi.Data;
using giftusApi.Models;
using OfficeOpenXml;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace giftusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BulkUploadController : ControllerBase
{
    private readonly GiftusDbContext _dbContext;
    private readonly ILogger<BulkUploadController> _logger;
    private readonly IWebHostEnvironment _environment;
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB
    private const string UploadFolderName = "resources/images";

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
    /// Upload and process Excel file for bulk product import
    /// </summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> UploadBulkData([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided" });

            if (file.Length > MaxFileSize)
                return BadRequest(new { error = $"File size exceeds {MaxFileSize / (1024 * 1024)} MB limit" });

            if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
                return BadRequest(new { error = "Only Excel files (.xlsx, .xls) are supported" });

            var result = await ProcessExcelFile(file);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading bulk data");
            return StatusCode(500, new { error = "Failed to process bulk upload", detail = ex.Message });
        }
    }

    private async Task<object> ProcessExcelFile(IFormFile file)
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

        // Read Excel file
        var tempFilePath = Path.Combine(Path.GetTempPath(), file.FileName);
        using (var stream = new FileStream(tempFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        try
        {
            // For now, we'll process CSV or JSON as Excel requires additional NuGet package
            // In production, you'd use EPPlus or OpenXml libraries
            var excelData = await ParseExcelData(tempFilePath);

            foreach (var row in excelData)
            {
                summary.TotalRows++;

                try
                {
                    await ProcessProductRow(row, uploadPath, summary);
                    summary.SuccessfulRows++;
                }
                catch (Exception ex)
                {
                    summary.FailedRows++;
                    summary.Errors.Add($"Row {summary.TotalRows}: {ex.Message}");
                    _logger.LogError(ex, "Error processing row {RowNumber}", summary.TotalRows);
                }
            }

            await _dbContext.SaveChangesAsync();
        }
        finally
        {
            if (System.IO.File.Exists(tempFilePath))
                System.IO.File.Delete(tempFilePath);
        }

        return new
        {
            message = "Bulk upload completed",
            summary = new
            {
                totalRows = summary.TotalRows,
                successfulRows = summary.SuccessfulRows,
                failedRows = summary.FailedRows,
                errors = summary.Errors
            }
        };
    }

    private async Task<List<Dictionary<string, string>>> ParseExcelData(string filePath)
    {
        var result = new List<Dictionary<string, string>>();

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using (var package = new ExcelPackage(new FileInfo(filePath)))
        {
            if (package.Workbook.Worksheets.Count == 0)
                throw new InvalidOperationException("Excel file contains no worksheets");

            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension?.Rows ?? 0;

            if (rowCount < 2)
                throw new InvalidOperationException("Excel file must contain at least header row and one data row");

            // Get headers from first row
            var headers = new List<string>();
            for (int col = 1; col <= worksheet.Dimension.Columns; col++)
            {
                var headerValue = worksheet.Cells[1, col].Value?.ToString()?.Trim() ?? $"Column{col}";
                headers.Add(headerValue);
            }

            // Process data rows
            for (int row = 2; row <= rowCount; row++)
            {
                var rowData = new Dictionary<string, string>();

                for (int col = 1; col <= headers.Count; col++)
                {
                    var cellValue = worksheet.Cells[row, col].Value?.ToString()?.Trim() ?? "";
                    rowData[headers[col - 1]] = cellValue;
                }

                // Only add rows that have at least one non-empty cell
                if (rowData.Values.Any(v => !string.IsNullOrEmpty(v)))
                    result.Add(rowData);
            }
        }

        return result;
    }

    private async Task ProcessProductRow(Dictionary<string, string> row, string uploadPath, BulkUploadSummary summary)
    {
        // Extract data from row
        var categoryName = row.GetValueOrDefault("Category")?.Trim() ?? throw new ArgumentException("Category is required");
        var modelNo = row.GetValueOrDefault("ModelNo")?.Trim() ?? throw new ArgumentException("ModelNo is required");
        var productName = row.GetValueOrDefault("ProductName")?.Trim() ?? throw new ArgumentException("ProductName is required");
        var slug = row.GetValueOrDefault("Slug")?.Trim() ?? productName.ToLower().Replace(" ", "-");
        var description = row.GetValueOrDefault("Description")?.Trim() ?? "";
        var baseImageUrl = row.GetValueOrDefault("ImageUrl")?.Trim() ?? "";
        var videoUrl = row.GetValueOrDefault("VideoUrl")?.Trim() ?? "";
        var gstPercentStr = row.GetValueOrDefault("GstPercent")?.Trim() ?? "18";
        var isCustomizable = row.GetValueOrDefault("IsCustomizable")?.Trim()?.ToLower() == "yes" || row.GetValueOrDefault("IsCustomizable")?.Trim() == "true";

        if (!decimal.TryParse(gstPercentStr, out var gstPercent))
            gstPercent = 18m;

        // Find or create category
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
            .FirstOrDefaultAsync(p => p.ModelNo == modelNo);

        Product product;
        if (existingProduct != null)
        {
            // Update existing product
            product = existingProduct;
            product.Name = productName;
            product.Slug = slug;
            product.ShortDescription = description;
            product.GstPercent = gstPercent;
            product.IsCustomizable = isCustomizable;
            product.VideoUrl = videoUrl;
            _dbContext.Products.Update(product);
        }
        else
        {
            // Create new product
            product = new Product
            {
                CategoryId = category.Id,
                ModelNo = modelNo,
                Name = productName,
                Slug = slug,
                ShortDescription = description,
                GstPercent = gstPercent,
                IsCustomizable = isCustomizable,
                VideoUrl = videoUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Products.Add(product);
        }

        await _dbContext.SaveChangesAsync();

        // Handle image if provided
        if (!string.IsNullOrEmpty(baseImageUrl))
        {
            try
            {
                var imageFileName = await DownloadAndStoreImage(baseImageUrl, product.ModelNo, uploadPath);
                product.BaseImageUrl = $"/resources/images/{imageFileName}";
                _dbContext.Products.Update(product);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to download image for product {ModelNo}", modelNo);
                // Don't fail the entire row if image download fails
            }
        }

        // Handle variants if provided
        var variantsJson = row.GetValueOrDefault("Variants")?.Trim();
        if (!string.IsNullOrEmpty(variantsJson))
        {
            try
            {
                await ProcessProductVariants(product, variantsJson);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to process variants for product {ModelNo}", modelNo);
            }
        }
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
                var extension = contentType.Split('/')[1]; // Extract extension from mime type
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

    private async Task ProcessProductVariants(Product product, string variantsJson)
    {
        // Parse JSON variants: [{"name":"Size","value":"M","price":100},{"name":"Size","value":"L","price":120}]
        try
        {
            var variants = System.Text.Json.JsonSerializer.Deserialize<List<VariantInput>>(variantsJson);
            if (variants != null && variants.Any())
            {
                foreach (var variantInput in variants)
                {
                    var existingVariant = await _dbContext.ProductVariants
                        .FirstOrDefaultAsync(v => v.ProductId == product.Id
                            && v.VariantName == variantInput.Name
                            && v.VariantValue == variantInput.Value);

                    if (existingVariant == null)
                    {
                        var variant = new ProductVariant
                        {
                            ProductId = product.Id,
                            VariantName = variantInput.Name,
                            VariantValue = variantInput.Value,
                            Price = variantInput.Price ?? 0,
                            StockQty = variantInput.StockQty ?? 0
                        };
                        _dbContext.ProductVariants.Add(variant);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse variants JSON: {VariantsJson}", variantsJson);
        }
    }

    public class VariantInput
    {
        public string Name { get; set; } = "Size";
        public string Value { get; set; } = null!;
        public decimal? Price { get; set; }
        public int? StockQty { get; set; }
    }

    /// <summary>
    /// Get template for Excel bulk upload
    /// </summary>
    [HttpGet("template")]
    public ActionResult GetTemplate()
    {
        try
        {
            var templateContent = @"Category,ModelNo,ProductName,Slug,Description,ImageUrl,VideoUrl,GstPercent,IsCustomizable,Variants
Trophy,TPHY001,Gold Trophy,gold-trophy,Premium gold trophy for winners,https://example.com/image1.jpg,,18,No,""[{""name"":""Size"",""value"":""Small"",""price"":500}]""
Crystal,CRYS001,Crystal Award,crystal-award,Elegant crystal award,https://example.com/image2.jpg,,18,Yes,""[{""name"":""Engraving"",""value"":""Yes"",""price"":100}]""";

            return Content(templateContent, "text/csv", System.Text.Encoding.UTF8);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating template");
            return StatusCode(500, new { error = "Failed to generate template" });
        }
    }
}

public class BulkUploadSummary
{
    public int TotalRows { get; set; }
    public int SuccessfulRows { get; set; }
    public int FailedRows { get; set; }
    public List<string> Errors { get; set; } = new();
}
