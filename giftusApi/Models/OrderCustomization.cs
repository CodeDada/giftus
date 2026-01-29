namespace giftusApi.Models;

public class OrderCustomization
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public string CustomizationKey { get; set; } = null!;
    public string? CustomizationValue { get; set; }

    // Foreign key navigation
    public OrderItem OrderItem { get; set; } = null!;
}
