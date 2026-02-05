namespace giftusApi.Models;

public class OrderRefund
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public decimal RefundAmount { get; set; }
    public string RefundReason { get; set; } = null!;
    public string RefundStatus { get; set; } = null!;  // Initiated, Completed, Failed
    public string? RefundTransactionId { get; set; }
    public string? RequestedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Order Order { get; set; } = null!;
}
