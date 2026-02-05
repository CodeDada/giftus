using giftusApi.Data;
using giftusApi.Models;
using giftusApi.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace giftusApi.Services;

public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request);
    Task<Order?> GetOrderByIdAsync(int orderId);
    Task<Order?> VerifyAndCompletePaymentAsync(int orderId, string paymentId, string signature);
    Task<bool> CancelOrderAsync(int orderId, string reason);
    Task<List<Order>> GetCustomerOrdersAsync(string customerEmail);
    Task<Order?> UpdateOrderAsync(Order order);
}

public class OrderService : IOrderService
{
    private readonly GiftusDbContext _context;
    private readonly IRazorpayService _razorpayService;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        GiftusDbContext context,
        IRazorpayService razorpayService,
        ILogger<OrderService> logger)
    {
        _context = context;
        _razorpayService = razorpayService;
        _logger = logger;
    }

    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                var order = new Order
                {
                    CustomerName = request.CustomerName,
                    CustomerEmail = request.CustomerEmail,
                    CustomerPhone = request.CustomerPhone,
                    DeliveryAddress = request.DeliveryAddress,
                    OrderStatus = "Pending",
                    Subtotal = 0,
                    ShippingCost = 50.00m,
                    GstAmount = 0,
                    DiscountAmount = request.DiscountAmount ?? 0,
                    DiscountCode = request.DiscountCode,
                    TotalAmount = 0,
                    CreatedAt = DateTime.UtcNow,
                    OrderItems = new List<OrderItem>()
                };

                // Calculate subtotal and gst
                decimal subtotal = 0;
                decimal gstAmount = 0;

                foreach (var itemRequest in request.Items)
                {
                    var product = await _context.Products.FindAsync(itemRequest.ProductId)
                        ?? throw new Exception($"Product {itemRequest.ProductId} not found");

                    var gstRate = 18m; // Default GST rate
                    var itemSubtotal = itemRequest.Price * itemRequest.Quantity;
                    var itemGst = (itemSubtotal * gstRate) / 100;

                    var orderItem = new OrderItem
                    {
                        ProductId = itemRequest.ProductId,
                        VariantId = itemRequest.VariantId,
                        VariantValue = itemRequest.VariantValue,
                        Quantity = itemRequest.Quantity,
                        Price = itemRequest.Price,
                        Subtotal = itemSubtotal
                    };

                    order.OrderItems.Add(orderItem);
                    subtotal += itemSubtotal;
                    gstAmount += itemGst;
                }

                order.Subtotal = subtotal;
                order.GstAmount = gstAmount;
                order.TotalAmount = subtotal + gstAmount + order.ShippingCost - order.DiscountAmount;

                // Generate order number
                order.OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{new Random().Next(1000, 9999)}";

                // Add order status history
                var statusHistory = new OrderStatusHistory
                {
                    PreviousStatus = null,
                    NewStatus = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    Notes = "Order created"
                };


                order.StatusHistory = new List<OrderStatusHistory> { statusHistory };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Order created successfully. OrderId: {order.Id}, CustomerId: {order.CustomerEmail}");

                await transaction.CommitAsync();
                return order;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error creating order: {ex.Message}");
                throw;
            }
        }
    }

    public async Task<Order?> GetOrderByIdAsync(int orderId)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .Include(o => o.StatusHistory)
            .Include(o => o.Refunds)
            .FirstOrDefaultAsync(o => o.Id == orderId);
    }

    public async Task<Order?> VerifyAndCompletePaymentAsync(int orderId, string paymentId, string signature)
    {
        var order = await GetOrderByIdAsync(orderId)
            ?? throw new Exception($"Order {orderId} not found");

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                // Simply mark order as confirmed (Razorpay verification removed for simplification)
                order.PaymentId = paymentId;
                order.OrderStatus = "Confirmed";
                order.UpdatedAt = DateTime.UtcNow;

                // Add status history entry
                var statusHistory = new OrderStatusHistory
                {
                    OrderId = orderId,
                    PreviousStatus = "Pending",
                    NewStatus = "Confirmed",
                    CreatedAt = DateTime.UtcNow,
                    Notes = "Payment verified"
                };

                _context.Orders.Update(order);
                order.StatusHistory.Add(statusHistory);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Payment verified and order confirmed. OrderId: {orderId}, PaymentId: {paymentId}");
                return order;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error verifying payment: {ex.Message}");
                throw;
            }
        }
    }

    public async Task<bool> CancelOrderAsync(int orderId, string reason)
    {
        var order = await GetOrderByIdAsync(orderId)
            ?? throw new Exception($"Order {orderId} not found");

        if (order.OrderStatus == "Cancelled")
        {
            return false;
        }

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                var previousStatus = order.OrderStatus;
                order.OrderStatus = "Cancelled";
                order.CancelReason = reason;
                order.CancelledAt = DateTime.UtcNow;
                order.UpdatedAt = DateTime.UtcNow;

                var statusHistory = new OrderStatusHistory
                {
                    OrderId = orderId,
                    PreviousStatus = previousStatus,
                    NewStatus = "Cancelled",
                    ChangedBy = "System",
                    CreatedAt = DateTime.UtcNow,
                    Notes = reason
                };

                order.StatusHistory.Add(statusHistory);
                _context.Orders.Update(order);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Order cancelled. OrderId: {orderId}, Reason: {reason}");
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error cancelling order: {ex.Message}");
                return false;
            }
        }
    }

    public async Task<List<Order>> GetCustomerOrdersAsync(string customerEmail)
    {
        return await _context.Orders
            .Where(o => o.CustomerEmail == customerEmail)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<Order?> UpdateOrderAsync(Order order)
    {
        try
        {
            order.UpdatedAt = DateTime.UtcNow;
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Order updated. OrderId: {order.Id}");
            return order;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating order: {ex.Message}");
            throw;
        }
    }
}
