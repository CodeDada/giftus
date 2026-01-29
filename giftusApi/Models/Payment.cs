namespace giftusApi.Models;

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string? PaymentGateway { get; set; }
    public string? PaymentId { get; set; }
    public string? PaymentStatus { get; set; }
    public decimal? Amount { get; set; }
    public DateTime CreatedAt { get; set; }

    // Foreign key navigation
    public Order Order { get; set; } = null!;
}
