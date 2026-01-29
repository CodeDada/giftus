namespace giftusApi.Models;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string VariantName { get; set; } = "Size";
    public string VariantValue { get; set; } = null!;
    public decimal Price { get; set; }
    public int StockQty { get; set; }

    // Foreign key navigation
    public Product Product { get; set; } = null!;

    // Navigation properties
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
