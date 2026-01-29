namespace giftusApi.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int VariantId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }

    // Foreign key navigations
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ProductVariant ProductVariant { get; set; } = null!;

    // Navigation properties
    public ICollection<OrderCustomization> OrderCustomizations { get; set; } = new List<OrderCustomization>();
}
