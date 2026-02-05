namespace giftusApi.Models;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = null!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? DeliveryAddress { get; set; }

    // Amount Details
    public decimal? Subtotal { get; set; }
    public decimal ShippingCost { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public string? DiscountCode { get; set; }
    public decimal? GstAmount { get; set; }
    public decimal? TotalAmount { get; set; }

    // Payment Details
    public string? PaymentId { get; set; }
    public string? PaymentMethod { get; set; }

    // Order Status
    public string OrderStatus { get; set; } = "Pending";
    public string? Notes { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }

    // Navigation properties
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public ICollection<OrderRefund> Refunds { get; set; } = new List<OrderRefund>();
    public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
}
