namespace giftusApi.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int VariantId { get; set; }
    public string? ModelNo { get; set; }
    public string? VariantValue { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal? Subtotal { get; set; }
    public decimal GstAmount { get; set; } = 0;
    public decimal GstRate { get; set; } = 18;
    public string? Notes { get; set; }

    // Foreign key navigations
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ProductVariant ProductVariant { get; set; } = null!;

    // Navigation properties
    public ICollection<OrderCustomization> OrderCustomizations { get; set; } = new List<OrderCustomization>();
}
