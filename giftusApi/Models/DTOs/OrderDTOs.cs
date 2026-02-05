namespace giftusApi.Models.DTOs;

public class CreateOrderRequest
{
    public string CustomerName { get; set; } = null!;
    public string CustomerEmail { get; set; } = null!;
    public string CustomerPhone { get; set; } = null!;
    public string DeliveryAddress { get; set; } = null!;
    public List<CreateOrderItemRequest> Items { get; set; } = new();
    public decimal? DiscountAmount { get; set; }
    public string? DiscountCode { get; set; }
}

public class CreateOrderItemRequest
{
    public int ProductId { get; set; }
    public int VariantId { get; set; }
    public string ModelNo { get; set; } = null!;
    public string VariantValue { get; set; } = null!;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class OrderResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = null!;
    public string CustomerName { get; set; } = null!;
    public string CustomerEmail { get; set; } = null!;
    public string CustomerPhone { get; set; } = null!;
    public decimal TotalAmount { get; set; }
    public string OrderStatus { get; set; } = null!;
    public string? PaymentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemResponse> Items { get; set; } = new();
}

public class OrderItemResponse
{
    public int Id { get; set; }
    public string ModelNo { get; set; } = null!;
    public string VariantValue { get; set; } = null!;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}

public class PaymentVerificationRequest
{
    public int OrderId { get; set; }
    public string PaymentId { get; set; } = null!;
    public string Signature { get; set; } = null!;
}

public class PaymentInitiationResponse
{
    public bool Success { get; set; }
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public string Message { get; set; } = null!;
}

public class UpdatePaymentMethodRequest
{
    public string PaymentMethod { get; set; } = null!; // "COD" or "UPI"
    public string? UpiId { get; set; } // UPI ID for UPI transfers (optional for COD)
}
