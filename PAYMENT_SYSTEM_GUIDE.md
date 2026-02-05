# TrophyBazaar Payment & Order System Implementation Guide

## Overview

This document provides a comprehensive guide to the payment and order management system implemented for TrophyBazaar. The system integrates Razorpay for payment processing and includes complete order lifecycle management.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                            │
│  ┌──────────────────┐          ┌──────────────────────┐         │
│  │  Cart Page       │          │  Checkout Page       │         │
│  │  - View items    │  ──────> │  - Collect info      │         │
│  │  - Update qty    │          │  - Place order       │         │
│  └──────────────────┘          └──────────────────────┘         │
│                                          │                       │
│                                          ▼                       │
│                        ┌──────────────────────────┐              │
│                        │  Razorpay Payment Modal  │              │
│                        │  - Enter payment details │              │
│                        │  - Complete transaction  │              │
│                        └──────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    HTTP API Communication
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  POST /orders   │   │  POST /verify-   │   │  GET /orders/    │
│  /create        │   │  payment         │   │  {id}            │
└─────────────────┘   └──────────────────┘   └──────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                  │
        │         ASP.NET Core API (Port 5056)           │
        │  ┌────────────────────────────────────────┐   │
        │  │        OrdersController                │   │
        │  │  - CreateOrder()                       │   │
        │  │  - VerifyPayment()                     │   │
        │  │  - GetOrder()                          │   │
        │  │  - GetCustomerOrders()                 │   │
        │  │  - CancelOrder()                       │   │
        │  └────────────────────────────────────────┘   │
        │                  │                             │
        │  ┌───────────────┼───────────────┐            │
        │  │               │               │            │
        │  ▼               ▼               ▼            │
        │ ┌──────┐  ┌──────────┐  ┌──────────────┐    │
        │ │Order │  │Razorpay  │  │OrderService  │    │
        │ │Serv  │  │Service   │  │              │    │
        │ └──────┘  └──────────┘  └──────────────┘    │
        └────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
   ┌──────────────┐                   ┌──────────────────┐
   │ SQL Server   │                   │   Razorpay API   │
   │ (Database)   │                   │ (Payment Gateway)│
   │ - Orders     │                   │ - Create order   │
   │ - OrderItems │                   │ - Verify payment │
   │ - Payments   │                   └──────────────────┘
   │ - Refunds    │
   └──────────────┘
```

## Database Schema

### Orders Table

```sql
CREATE TABLE Orders (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderNumber NVARCHAR(50) UNIQUE NOT NULL,
    CustomerId INT,
    CustomerName NVARCHAR(200) NOT NULL,
    CustomerEmail NVARCHAR(200) NOT NULL,
    CustomerPhone NVARCHAR(20) NOT NULL,
    DeliveryAddress NVARCHAR(500) NOT NULL,
    OrderStatus NVARCHAR(50) DEFAULT 'Pending',
    PaymentStatus NVARCHAR(50) DEFAULT 'Initiated',
    Subtotal DECIMAL(10,2),
    ShippingCost DECIMAL(10,2),
    TaxAmount DECIMAL(10,2),
    DiscountAmount DECIMAL(10,2),
    TotalAmount DECIMAL(10,2),
    PaymentId NVARCHAR(100),
    PaymentMethod NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME,
    CompletedAt DATETIME,
    CancelledAt DATETIME,
    CancelReason NVARCHAR(500),
    FOREIGN KEY (CustomerId) REFERENCES Customers(Id)
)
```

### OrderItems Table

```sql
CREATE TABLE OrderItems (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    VariantId INT,
    ModelNo NVARCHAR(50),
    VariantValue NVARCHAR(200),
    Quantity INT,
    Price DECIMAL(10,2),
    Subtotal DECIMAL(10,2),
    GstRate DECIMAL(5,2) DEFAULT 18,
    GstAmount DECIMAL(10,2),
    Notes NVARCHAR(500),
    FOREIGN KEY (OrderId) REFERENCES Orders(Id),
    FOREIGN KEY (ProductId) REFERENCES Products(Id),
    FOREIGN KEY (VariantId) REFERENCES ProductVariants(Id)
)
```

### PaymentTransactions Table

```sql
CREATE TABLE PaymentTransactions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    PaymentGateway NVARCHAR(50) NOT NULL,
    TransactionId NVARCHAR(100) NOT NULL,
    Amount DECIMAL(10,2),
    Currency NVARCHAR(10) DEFAULT 'INR',
    Status NVARCHAR(50),
    PaymentMethod NVARCHAR(50),
    ResponseData NVARCHAR(MAX),
    ErrorMessage NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME,
    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
)
```

### OrderStatusHistory Table

```sql
CREATE TABLE OrderStatusHistories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    PreviousStatus NVARCHAR(50),
    NewStatus NVARCHAR(50) NOT NULL,
    ChangedBy NVARCHAR(200),
    Notes NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
)
```

### OrderRefunds Table

```sql
CREATE TABLE OrderRefunds (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    RefundAmount DECIMAL(10,2),
    RefundReason NVARCHAR(500),
    RefundStatus NVARCHAR(50),
    RefundTransactionId NVARCHAR(100),
    RequestedBy NVARCHAR(200),
    ProcessedAt DATETIME,
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
)
```

## API Endpoints

### 1. Create Order

**Endpoint:** `POST /api/orders/create`

**Request:**

```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9876543210",
  "deliveryAddress": "123 Main Street, City, State - 123456",
  "shippingCost": 50,
  "discountAmount": 0,
  "discountCode": null,
  "items": [
    {
      "productId": 1,
      "variantId": null,
      "modelNo": "CRT-001",
      "variantValue": "Small",
      "price": 500,
      "quantity": 2,
      "gstRate": 18,
      "notes": ""
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "orderId": 123,
  "orderNumber": "order_123_1234567890",
  "amount": 1236,
  "message": "Order created successfully. Proceed to payment."
}
```

**Status:** 201 Created
**Errors:**

- 400: Invalid request data
- 500: Server error

### 2. Verify Payment

**Endpoint:** `POST /api/orders/verify-payment`

**Request:**

```json
{
  "orderId": 123,
  "paymentId": "pay_1234567890abcdef",
  "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

**Response:**

```json
{
  "id": 123,
  "orderNumber": "order_123_1234567890",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9876543210",
  "deliveryAddress": "123 Main Street, City, State - 123456",
  "subtotal": 1000,
  "shippingCost": 50,
  "taxAmount": 180,
  "discountAmount": 0,
  "totalAmount": 1230,
  "orderStatus": "Confirmed",
  "paymentStatus": "Completed",
  "paymentId": "pay_1234567890abcdef",
  "createdAt": "2024-01-15T10:30:00Z",
  "items": [
    {
      "productId": 1,
      "productName": "Trophy A",
      "modelNo": "CRT-001",
      "variantValue": "Small",
      "quantity": 2,
      "price": 500,
      "subtotal": 1000,
      "gstRate": 18,
      "gstAmount": 180
    }
  ]
}
```

**Status:** 200 OK
**Errors:**

- 400: Invalid signature
- 404: Order not found
- 500: Server error

### 3. Get Order Details

**Endpoint:** `GET /api/orders/{id}`

**Response:** Same as Verify Payment response

**Status:** 200 OK
**Errors:**

- 404: Order not found
- 500: Server error

### 4. Get Customer Orders

**Endpoint:** `GET /api/orders/customer/{email}`

**Response:** Array of order objects

**Status:** 200 OK
**Errors:**

- 500: Server error

### 5. Cancel Order

**Endpoint:** `POST /api/orders/{id}/cancel`

**Request:**

```json
{
  "reason": "Customer requested cancellation"
}
```

**Response:**

```json
{
  "message": "Order cancelled successfully"
}
```

**Status:** 200 OK
**Errors:**

- 400: Order already cancelled
- 404: Order not found
- 500: Server error

## C# Models

### Order.cs

```csharp
public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; }
    public int? CustomerId { get; set; }
    public string CustomerName { get; set; }
    public string CustomerEmail { get; set; }
    public string CustomerPhone { get; set; }
    public string DeliveryAddress { get; set; }

    // Order amounts
    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // Status tracking
    public string OrderStatus { get; set; } // "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"
    public string PaymentStatus { get; set; } // "Initiated", "Completed", "Failed", "Refunded"

    // Payment details
    public string? PaymentId { get; set; }
    public string? PaymentMethod { get; set; }
    public string? DiscountCode { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelReason { get; set; }

    // Navigation properties
    public virtual ICollection<OrderItem> OrderItems { get; set; }
    public virtual ICollection<OrderStatusHistory> StatusHistory { get; set; }
    public virtual ICollection<OrderRefund> Refunds { get; set; }
}
```

### OrderItem.cs

```csharp
public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int? VariantId { get; set; }

    // Product details
    public string ModelNo { get; set; }
    public string VariantValue { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }

    // Pricing
    public decimal Subtotal { get; set; }
    public decimal GstRate { get; set; }
    public decimal GstAmount { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Order Order { get; set; }
    public virtual Product Product { get; set; }
    public virtual ProductVariant? ProductVariant { get; set; }
}
```

### PaymentTransaction.cs

```csharp
public class PaymentTransaction
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string PaymentGateway { get; set; } // "Razorpay", "Stripe"
    public string TransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } // "INR"
    public string Status { get; set; } // "Success", "Failed", "Initiated"
    public string? PaymentMethod { get; set; }
    public string? ResponseData { get; set; } // JSON
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual Order Order { get; set; }
}
```

## Services

### IRazorpayService

Handles Razorpay integration:

- `VerifyPaymentSignature()`: Verifies Razorpay payment signature
- `GenerateOrderIdForRazorpay()`: Generates unique order ID for Razorpay

### IOrderService

Manages order operations:

- `CreateOrderAsync()`: Creates new order from cart
- `GetOrderByIdAsync()`: Retrieves order details
- `VerifyAndCompletePaymentAsync()`: Verifies payment and completes order
- `CancelOrderAsync()`: Cancels an order
- `GetCustomerOrdersAsync()`: Retrieves customer's orders

## Frontend Integration

### Checkout Page Flow

1. **Cart → Checkout Navigation**
   - User clicks "Proceed to Checkout" from cart
   - Validates cart has items
   - Redirects to `/checkout`

2. **Collect Customer Information**
   - Name, email, phone
   - Delivery address
   - Display order summary with totals

3. **Create Order**
   - Form validation
   - API call to `POST /api/orders/create`
   - Receive orderId and amount

4. **Payment Processing**
   - Load Razorpay script
   - Initialize Razorpay with order details
   - User enters payment details in modal
   - Razorpay processes payment
   - Returns paymentId and signature

5. **Payment Verification**
   - Send `POST /api/orders/verify-payment`
   - Backend verifies signature with Razorpay
   - Order status updated to "Confirmed"
   - Redirect to `/order-confirmation?orderId={id}`

6. **Order Confirmation**
   - Display order details
   - Show delivery address
   - Display order items and totals
   - Show next steps

## Configuration

### appsettings.json

```json
{
  "Razorpay": {
    "KeyId": "YOUR_RAZORPAY_KEY_ID",
    "KeySecret": "YOUR_RAZORPAY_KEY_SECRET"
  }
}
```

### Environment Variables (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5056
NEXT_PUBLIC_RAZORPAY_KEY=YOUR_RAZORPAY_KEY_ID
```

## Payment Flow Diagram

```
┌──────────────────────┐
│  Customer selects    │
│  items in cart       │
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│  Click "Checkout"    │
│  Go to /checkout     │
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│  Fill delivery info  │
│  Review order        │
└──────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│  API: POST /api/orders/create        │
│  - Create order in DB                │
│  - Calculate totals                  │
│  - Return orderId and amount         │
└──────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│  Load Razorpay Payment Modal         │
│  - Display amount                    │
│  - Accept payment details            │
│  - Process card/UPI/etc              │
└──────────────────────────────────────┘
          │
          ├─── Payment Success ──────┐
          │                          │
          ▼                          │
┌──────────────────────────────────┐ │
│  API: POST /verify-payment       │ │
│  - Verify signature              │ │
│  - Update order to "Confirmed"   │ │
│  - Record payment transaction    │ │
└──────────────────────────────────┘ │
          │                          │
          ▼                          │
┌──────────────────────────────────┐ │
│  Redirect to confirmation page   │ │
│  - Show order details            │ │
│  - Show next steps               │ │
│  - Clear cart                    │ │
└──────────────────────────────────┘ │
                                     │
          ├─── Payment Failed ───────┘
          │
          ▼
┌──────────────────────────────────┐
│  Show error message              │
│  Allow retry                     │
└──────────────────────────────────┘
```

## Error Handling

### Frontend Error Handling

- Validate form before submission
- Display user-friendly error messages
- Implement retry logic for failed payments
- Log errors for debugging

### Backend Error Handling

- Validate request data
- Handle database transaction failures
- Catch payment verification errors
- Log all errors with context
- Return appropriate HTTP status codes

## Security Considerations

1. **Signature Verification**
   - Always verify Razorpay signature on backend
   - Use HMAC-SHA256 for verification
   - Don't trust client-side payment completion

2. **Data Validation**
   - Validate all input fields
   - Sanitize address and notes fields
   - Check quantities are positive

3. **Amount Verification**
   - Verify amount from request matches order calculation
   - Recalculate totals on backend
   - Store payment amount for audit trail

4. **Database Transactions**
   - Use transactions for order creation
   - Rollback on errors
   - Ensure consistency

5. **API Security**
   - Implement rate limiting
   - Use HTTPS only
   - Add request logging
   - Monitor for suspicious patterns

## Testing

### Razorpay Test Credentials

- Test Key ID: `rzp_test_xxxxx`
- Test Secret: `xxxxx`

### Test Cards

- **Visa:** 4111 1111 1111 1111
- **Mastercard:** 5555 5555 5555 4444
- **Amex:** 3782 822463 10005

### Test UPI IDs

- `success@razorpay`
- `failure@razorpay`

## Deployment Checklist

- [ ] Set up SQL Server database with all tables
- [ ] Configure Razorpay credentials in appsettings.json
- [ ] Set environment variables for frontend
- [ ] Run EF Core migrations
- [ ] Build and test API locally
- [ ] Deploy to production server
- [ ] Test end-to-end payment flow
- [ ] Monitor error logs
- [ ] Set up email notifications (future)

## Future Enhancements

1. **Email Notifications**
   - Order confirmation email
   - Shipping updates
   - Delivery confirmation

2. **Order Tracking**
   - Real-time tracking
   - SMS notifications
   - Delivery partner integration

3. **Refund Management**
   - Process refunds via API
   - Track refund status
   - Update order status

4. **Analytics**
   - Order metrics
   - Payment success rates
   - Customer behavior tracking

5. **Additional Payment Methods**
   - Multiple payment gateways
   - Wallet integration
   - BNPL options

## Support & Troubleshooting

### Common Issues

**1. Signature Verification Fails**

- Verify Key Secret is correct
- Check signature format
- Ensure order ID and payment ID are correct

**2. Order Not Created**

- Check database connection
- Verify product IDs exist
- Check available stock

**3. Payment Modal Not Appearing**

- Verify Razorpay script loads
- Check Key ID configuration
- Clear browser cache

**4. Order Status Not Updating**

- Check backend logs
- Verify payment transaction recorded
- Check database permissions

## Contact & Support

For issues or questions:

- Email: support@trophybazaar.in
- Documentation: See CART_IMPLEMENTATION.md
- API Docs: /openapi/v1.json
