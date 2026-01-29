using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using giftusApi.Data;
using giftusApi.Models;

namespace giftusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly GiftusDbContext _dbContext;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(GiftusDbContext dbContext, ILogger<CategoriesController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Get all categories
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        try
        {
            var categories = await _dbContext.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching categories");
            return StatusCode(500, new { error = "Failed to fetch categories", detail = ex.Message });
        }
    }

    /// <summary>
    /// Get category by ID with products
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Category>> GetCategory(int id)
    {
        try
        {
            var category = await _dbContext.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return NotFound(new { error = "Category not found" });

            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching category {id}", id);
            return StatusCode(500, new { error = "Failed to fetch category", detail = ex.Message });
        }
    }

    /// <summary>
    /// Create a new category
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        try
        {
            // Check if slug already exists
            var existingCategory = await _dbContext.Categories
                .FirstOrDefaultAsync(c => c.Slug == dto.Slug);

            if (existingCategory != null)
                return BadRequest(new { error = "Slug already exists" });

            var category = new Category
            {
                Name = dto.Name,
                Slug = dto.Slug,
                Description = dto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Categories.Add(category);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, new { error = "Failed to create category", detail = ex.Message });
        }
    }

    /// <summary>
    /// Update a category
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        try
        {
            var category = await _dbContext.Categories.FindAsync(id);

            if (category == null)
                return NotFound(new { error = "Category not found" });

            category.Name = dto.Name ?? category.Name;
            category.Description = dto.Description ?? category.Description;
            category.IsActive = dto.IsActive ?? category.IsActive;

            _dbContext.Categories.Update(category);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Category updated successfully", data = category });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {id}", id);
            return StatusCode(500, new { error = "Failed to update category", detail = ex.Message });
        }
    }

    /// <summary>
    /// Delete a category
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var category = await _dbContext.Categories.FindAsync(id);

            if (category == null)
                return NotFound(new { error = "Category not found" });

            _dbContext.Categories.Remove(category);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Category deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {id}", id);
            return StatusCode(500, new { error = "Failed to delete category", detail = ex.Message });
        }
    }
}

// DTOs
public class CreateCategoryDto
{
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
}

public class UpdateCategoryDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}
