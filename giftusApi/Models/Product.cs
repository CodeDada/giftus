namespace giftusApi.Models;

public class Product
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string ModelNo { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? BaseImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? ShortDescription { get; set; }
    public decimal GstPercent { get; set; }
    public int Quantity { get; set; } = 0; // Total stock quantity
    public bool IsCustomizable { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    // Foreign key navigation
    public Category Category { get; set; } = null!;

    // Navigation properties
    public ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
