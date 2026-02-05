namespace giftusApi.Models;

public class PaymentTransaction
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string PaymentGateway { get; set; } = null!;  // Razorpay, Stripe
    public string TransactionId { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = null!;  // Initiated, Success, Failed, Refunded
    public string? PaymentMethod { get; set; }
    public string? ResponseData { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation property
    public Order Order { get; set; } = null!;
}
