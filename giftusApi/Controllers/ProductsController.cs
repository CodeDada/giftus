using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using giftusApi.Data;
using giftusApi.Models;

namespace giftusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly GiftusDbContext _dbContext;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(GiftusDbContext dbContext, ILogger<ProductsController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Get all active products with variants and images
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(
        [FromQuery] int? categoryId = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var query = _dbContext.Products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .Include(p => p.ProductImages)
                .Where(p => p.IsActive);

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId);

            var products = await query
                .OrderBy(p => p.Name)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => MapToDto(p))
                .ToListAsync();

            return Ok(new { data = products, pageNumber, pageSize, total = await query.CountAsync() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching products");
            return StatusCode(500, new { error = "Failed to fetch products", detail = ex.Message });
        }
    }

    /// <summary>
    /// Get product by ID with all details
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        try
        {
            var product = await _dbContext.Products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .Include(p => p.ProductImages)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (product == null)
                return NotFound(new { error = "Product not found" });

            return Ok(MapToDto(product));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product {id}", id);
            return StatusCode(500, new { error = "Failed to fetch product", detail = ex.Message });
        }
    }

    /// <summary>
    /// Get products by category slug
    /// </summary>
    [HttpGet("category/{slug}")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProductsByCategory(string slug)
    {
        try
        {
            var products = await _dbContext.Products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .Include(p => p.ProductImages)
                .Where(p => p.Category.Slug == slug && p.IsActive)
                .OrderBy(p => p.Name)
                .Select(p => MapToDto(p))
                .ToListAsync();

            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching products for category {slug}", slug);
            return StatusCode(500, new { error = "Failed to fetch products", detail = ex.Message });
        }
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            // Validate category exists
            var category = await _dbContext.Categories.FindAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { error = "Category not found" });

            // Check if ModelNo already exists
            var existingProduct = await _dbContext.Products
                .FirstOrDefaultAsync(p => p.ModelNo == dto.ModelNo);
            if (existingProduct != null)
                return BadRequest(new { error = "ModelNo already exists" });

            var product = new Product
            {
                CategoryId = dto.CategoryId,
                ModelNo = dto.ModelNo,
                Name = dto.Name,
                Slug = dto.Slug,
                BaseImageUrl = dto.BaseImageUrl,
                VideoUrl = dto.VideoUrl,
                ShortDescription = dto.ShortDescription,
                GstPercent = dto.GstPercent ?? 18.00m,
                IsCustomizable = dto.IsCustomizable ?? true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Products.Add(product);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, MapToDto(product));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new { error = "Failed to create product", detail = ex.Message });
        }
    }

    /// <summary>
    /// Update a product
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        try
        {
            var product = await _dbContext.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { error = "Product not found" });

            product.Name = dto.Name ?? product.Name;
            product.ShortDescription = dto.ShortDescription ?? product.ShortDescription;
            product.BaseImageUrl = dto.BaseImageUrl ?? product.BaseImageUrl;
            product.VideoUrl = dto.VideoUrl ?? product.VideoUrl;
            product.GstPercent = dto.GstPercent ?? product.GstPercent;
            product.IsCustomizable = dto.IsCustomizable ?? product.IsCustomizable;
            product.IsActive = dto.IsActive ?? product.IsActive;

            _dbContext.Products.Update(product);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Product updated successfully", data = MapToDto(product) });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {id}", id);
            return StatusCode(500, new { error = "Failed to update product", detail = ex.Message });
        }
    }

    /// <summary>
    /// Add a variant to a product
    /// </summary>
    [HttpPost("{id}/variants")]
    public async Task<ActionResult<ProductVariant>> AddVariant(int id, [FromBody] CreateVariantDto dto)
    {
        try
        {
            var product = await _dbContext.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { error = "Product not found" });

            // Check unique constraint
            var existingVariant = await _dbContext.ProductVariants
                .FirstOrDefaultAsync(v => v.ProductId == id 
                    && v.VariantName == dto.VariantName 
                    && v.VariantValue == dto.VariantValue);

            if (existingVariant != null)
                return BadRequest(new { error = "Variant already exists for this product" });

            var variant = new ProductVariant
            {
                ProductId = id,
                VariantName = dto.VariantName ?? "Size",
                VariantValue = dto.VariantValue,
                Price = dto.Price,
                StockQty = dto.StockQty ?? 0
            };

            _dbContext.ProductVariants.Add(variant);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = id }, variant);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding variant to product {id}", id);
            return StatusCode(500, new { error = "Failed to add variant", detail = ex.Message });
        }
    }

    /// <summary>
    /// Add an image to a product
    /// </summary>
    [HttpPost("{id}/images")]
    public async Task<ActionResult<ProductImage>> AddImage(int id, [FromBody] CreateImageDto dto)
    {
        try
        {
            var product = await _dbContext.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { error = "Product not found" });

            var image = new ProductImage
            {
                ProductId = id,
                ImageUrl = dto.ImageUrl,
                SortOrder = dto.SortOrder ?? 0,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.ProductImages.Add(image);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = id }, image);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding image to product {id}", id);
            return StatusCode(500, new { error = "Failed to add image", detail = ex.Message });
        }
    }

    /// <summary>
    /// Delete a product
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var product = await _dbContext.Products.FindAsync(id);
            if (product == null)
                return NotFound(new { error = "Product not found" });

            _dbContext.Products.Remove(product);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Product deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {id}", id);
            return StatusCode(500, new { error = "Failed to delete product", detail = ex.Message });
        }
    }

    private ProductDto MapToDto(Product product)
    {
        return new ProductDto
        {
            Id = product.Id,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            ModelNo = product.ModelNo,
            Name = product.Name,
            Slug = product.Slug,
            BaseImageUrl = product.BaseImageUrl,
            VideoUrl = product.VideoUrl,
            ShortDescription = product.ShortDescription,
            GstPercent = product.GstPercent,
            IsCustomizable = product.IsCustomizable,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            Variants = product.ProductVariants?.Select(v => new VariantDto
            {
                Id = v.Id,
                VariantName = v.VariantName,
                VariantValue = v.VariantValue,
                Price = v.Price,
                StockQty = v.StockQty
            }).ToList(),
            Images = product.ProductImages?.OrderBy(i => i.SortOrder)
                .Select(i => new ImageDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    SortOrder = i.SortOrder
                }).ToList()
        };
    }
}

// DTOs
public class ProductDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string ModelNo { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? BaseImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? ShortDescription { get; set; }
    public decimal GstPercent { get; set; }
    public bool IsCustomizable { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<VariantDto>? Variants { get; set; }
    public List<ImageDto>? Images { get; set; }
}

public class VariantDto
{
    public int Id { get; set; }
    public string VariantName { get; set; } = null!;
    public string VariantValue { get; set; } = null!;
    public decimal Price { get; set; }
    public int StockQty { get; set; }
}

public class ImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = null!;
    public int SortOrder { get; set; }
}

public class CreateProductDto
{
    public int CategoryId { get; set; }
    public string ModelNo { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? BaseImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? ShortDescription { get; set; }
    public decimal? GstPercent { get; set; }
    public bool? IsCustomizable { get; set; }
}

public class UpdateProductDto
{
    public string? Name { get; set; }
    public string? ShortDescription { get; set; }
    public string? BaseImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public decimal? GstPercent { get; set; }
    public bool? IsCustomizable { get; set; }
    public bool? IsActive { get; set; }
}

public class CreateVariantDto
{
    public string? VariantName { get; set; }
    public string VariantValue { get; set; } = null!;
    public decimal Price { get; set; }
    public int? StockQty { get; set; }
}

public class CreateImageDto
{
    public string ImageUrl { get; set; } = null!;
    public int? SortOrder { get; set; }
}
