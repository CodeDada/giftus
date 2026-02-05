using giftusApi.Models;
using giftusApi.Models.DTOs;
using giftusApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace giftusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new order from cart items
    /// </summary>
    [HttpPost("create")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Items == null || request.Items.Count == 0)
                return BadRequest("Order must contain at least one item");

            var order = await _orderService.CreateOrderAsync(request);

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, new
            {
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                amount = order.TotalAmount ?? 0,
                message = "Order created successfully. Proceed to payment."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating order: {ex.Message}");
            return StatusCode(500, new { message = "Error creating order", error = ex.Message });
        }
    }

    /// <summary>
    /// Get order by ID with all details
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        try
        {
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
                return NotFound(new { message = "Order not found" });

            return Ok(new
            {
                id = order.Id,
                orderNumber = order.OrderNumber,
                customerName = order.CustomerName,
                customerEmail = order.CustomerEmail,
                customerPhone = order.CustomerPhone,
                deliveryAddress = order.DeliveryAddress,
                subtotal = order.Subtotal ?? 0,
                shippingCost = order.ShippingCost,
                gstAmount = order.GstAmount ?? 0,
                discountAmount = order.DiscountAmount,
                totalAmount = order.TotalAmount ?? 0,
                orderStatus = order.OrderStatus,
                paymentMethod = order.PaymentMethod,
                paymentStatus = order.OrderStatus, // Use OrderStatus as PaymentStatus for now
                paymentId = order.PaymentId,
                createdAt = order.CreatedAt,
                items = (object?)(order.OrderItems?.Select(oi => new
                {
                    id = oi.Id,
                    productId = oi.ProductId,
                    quantity = oi.Quantity,
                    price = oi.Price,
                    subtotal = oi.Subtotal ?? 0
                }).ToList()) ?? new List<dynamic>(),
                statusHistory = (object?)(order.StatusHistory?.Select(sh => new
                {
                    id = sh.Id,
                    previousStatus = sh.PreviousStatus,
                    newStatus = sh.NewStatus,
                    notes = sh.Notes,
                    createdAt = sh.CreatedAt
                }).OrderByDescending(sh => sh.createdAt).ToList()) ?? new List<dynamic>()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error retrieving order: {ex.Message}");
            return StatusCode(500, new { message = "Error retrieving order", error = ex.Message });
        }
    }

    /// <summary>
    /// Update payment method for an order
    /// </summary>
    [HttpPost("{id}/update-payment")]
    public async Task<IActionResult> UpdatePaymentMethod(int id, [FromBody] UpdatePaymentMethodRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
                return NotFound(new { message = "Order not found" });

            // Update payment method
            order.PaymentMethod = request.PaymentMethod;

            // For UPI, store the UPI ID
            if (request.PaymentMethod == "UPI" && !string.IsNullOrEmpty(request.UpiId))
                order.PaymentId = request.UpiId;

            // Update order status
            var previousStatus = order.OrderStatus;
            order.OrderStatus = request.PaymentMethod == "COD" ? "ConfirmedCOD" : "PendingUPI";

            // Add status history
            var statusHistory = new OrderStatusHistory
            {
                OrderId = order.Id,
                PreviousStatus = previousStatus,
                NewStatus = order.OrderStatus,
                CreatedAt = DateTime.UtcNow,
                Notes = $"Payment method selected: {request.PaymentMethod}"
            };

            order.StatusHistory.Add(statusHistory);

            // Save changes
            await _orderService.UpdateOrderAsync(order);

            return Ok(new
            {
                message = "Payment method updated successfully",
                orderId = order.Id,
                paymentMethod = order.PaymentMethod,
                orderStatus = order.OrderStatus
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating payment method: {ex.Message}");
            return StatusCode(500, new { message = "Error updating payment method", error = ex.Message });
        }
    }

    /// <summary>
    /// Get customer orders by email
    /// </summary>
    [HttpGet("customer/{email}")]
    public async Task<IActionResult> GetCustomerOrders(string email)
    {
        try
        {
            var orders = await _orderService.GetCustomerOrdersAsync(email);

            return Ok(orders.Select(o => new
            {
                id = o.Id,
                orderNumber = o.OrderNumber,
                customerName = o.CustomerName,
                totalAmount = o.TotalAmount,
                orderStatus = o.OrderStatus,
                createdAt = o.CreatedAt,
                itemCount = o.OrderItems?.Count ?? 0
            }).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error retrieving customer orders: {ex.Message}");
            return StatusCode(500, new { message = "Error retrieving customer orders", error = ex.Message });
        }
    }

    /// <summary>
    /// Cancel an order
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelOrderRequest? request)
    {
        try
        {
            var reason = request?.Reason ?? "User requested cancellation";
            var success = await _orderService.CancelOrderAsync(id, reason);

            if (!success)
                return BadRequest(new { message = "Order cannot be cancelled (already cancelled or completed)" });

            return Ok(new { message = "Order cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error cancelling order: {ex.Message}");
            return StatusCode(500, new { message = "Error cancelling order", error = ex.Message });
        }
    }
}

/// <summary>
/// Request model for cancelling orders
/// </summary>
public class CancelOrderRequest
{
    public string? Reason { get; set; }
}

