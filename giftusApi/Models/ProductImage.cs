namespace giftusApi.Models;

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }

    // Foreign key navigation
    public Product Product { get; set; } = null!;
}
