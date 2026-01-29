namespace giftusApi.Models;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = null!;
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? DeliveryAddress { get; set; }
    public decimal? Subtotal { get; set; }
    public decimal? GstAmount { get; set; }
    public decimal? TotalAmount { get; set; }
    public string OrderStatus { get; set; } = "PENDING";
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
