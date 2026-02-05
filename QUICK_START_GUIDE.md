# Quick Start Guide - Payment & Order System

## 🚀 Getting Started in 5 Minutes

### Step 1: Configure Razorpay Credentials

**File:** `giftusApi/appsettings.json`

```json
{
  "Razorpay": {
    "KeyId": "rzp_live_YOUR_KEY_ID",
    "KeySecret": "YOUR_KEY_SECRET"
  }
}
```

**Test Credentials** (for development):

- Key ID: `rzp_test_xxxxx`
- Key Secret: `xxxxx`

### Step 2: Set Frontend Environment Variables

**File:** `giftusUI/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:5056
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_YOUR_KEY_ID
```

### Step 3: Start the Backend

```bash
cd giftusApi
dotnet build
dotnet run --urls "http://localhost:5056"
```

Expected output:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5056
```

### Step 4: Start the Frontend

```bash
cd giftusUI
npm install
npm run dev
```

Expected output:

```
▲ Next.js 16.x
- Local: http://localhost:3000
```

### Step 5: Test the Flow

1. **Add Items to Cart**
   - Navigate to product page
   - Click "Add to Cart"
   - Verify item appears in cart

2. **Proceed to Checkout**
   - Go to `/cart`
   - Click "Proceed to Checkout"
   - Fill in customer details

3. **Complete Payment**
   - Click "Proceed to Payment"
   - Use test card: `4111 1111 1111 1111`
   - Verify success page

## 📋 Common Tasks

### Create a New Order (API)

```bash
curl -X POST http://localhost:5056/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "9876543210",
    "deliveryAddress": "123 Main St, City, State 12345",
    "shippingCost": 50,
    "items": [
      {
        "productId": 1,
        "variantId": null,
        "modelNo": "CRT-001",
        "variantValue": "Small",
        "price": 500,
        "quantity": 2,
        "gstRate": 18
      }
    ]
  }'
```

### Verify Payment (API)

```bash
curl -X POST http://localhost:5056/api/orders/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "paymentId": "pay_123456789",
    "signature": "signature_from_razorpay"
  }'
```

### Get Order Details (API)

```bash
curl http://localhost:5056/api/orders/1
```

### Get Customer Orders (API)

```bash
curl "http://localhost:5056/api/orders/customer/john@example.com"
```

### Cancel Order (API)

```bash
curl -X POST http://localhost:5056/api/orders/1/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer requested"}'
```

## 🔍 Troubleshooting

### "Connection refused" error

**Problem:** Backend not running
**Solution:**

```bash
cd giftusApi
dotnet run --urls "http://localhost:5056"
```

### "CORS error" in browser

**Problem:** Frontend making request to wrong API URL
**Solution:** Update `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5056
```

### "Razorpay key not found"

**Problem:** Missing Razorpay config
**Solution:** Update `appsettings.json` with actual credentials

### "Database connection failed"

**Problem:** SQL Server not accessible
**Solution:** Verify connection string in `appsettings.json`

### "Payment signature verification failed"

**Problem:** Invalid signature or key secret
**Solution:**

- Verify Key Secret is correct
- Check test vs. live credentials
- Ensure signature format is correct

## 📁 Key Files to Know

| File                                        | Purpose                |
| ------------------------------------------- | ---------------------- |
| `giftusApi/Controllers/OrdersController.cs` | API endpoints          |
| `giftusApi/Services/OrderService.cs`        | Business logic         |
| `giftusApi/Services/RazorpayService.cs`     | Payment verification   |
| `giftusApi/Models/Order.cs`                 | Order entity           |
| `giftusUI/app/checkout/page.tsx`            | Checkout page          |
| `giftusUI/app/order-confirmation/page.tsx`  | Confirmation page      |
| `giftusUI/lib/cartContext.tsx`              | Cart state             |
| `PAYMENT_SYSTEM_GUIDE.md`                   | Complete documentation |

## 🧪 Test Cards for Razorpay

| Card Type  | Number              | Expiry | CVV |
| ---------- | ------------------- | ------ | --- |
| Visa       | 4111 1111 1111 1111 | 12/25  | 123 |
| Mastercard | 5555 5555 5555 4444 | 12/25  | 123 |
| Amex       | 3782 822463 10005   | 12/25  | 123 |

## 📊 API Response Examples

### Order Created (201)

```json
{
  "success": true,
  "orderId": 1,
  "orderNumber": "order_1_1705303800000",
  "amount": 1230,
  "message": "Order created successfully. Proceed to payment."
}
```

### Payment Verified (200)

```json
{
  "id": 1,
  "orderNumber": "order_1_1705303800000",
  "customerName": "John Doe",
  "orderStatus": "Confirmed",
  "paymentStatus": "Completed",
  "totalAmount": 1230,
  "createdAt": "2024-01-15T10:30:00Z",
  "items": [...]
}
```

### Error Response (400/500)

```json
{
  "message": "Error message",
  "error": "Detailed error information"
}
```

## 🔐 Security Checklist

- [ ] Razorpay credentials updated (not test keys)
- [ ] HTTPS enabled in production
- [ ] API rate limiting configured
- [ ] Database backups enabled
- [ ] Error logging reviewed
- [ ] Sensitive data not exposed in logs
- [ ] CORS properly configured
- [ ] Database transactions enabled

## 📈 Monitoring

### Check Backend Logs

```bash
# Watch logs in real-time
tail -f /var/log/giftusapi/application.log

# Search for errors
grep "ERROR" /var/log/giftusapi/application.log
```

### Monitor Database

```sql
-- Check recent orders
SELECT * FROM Orders ORDER BY CreatedAt DESC;

-- Check failed payments
SELECT * FROM PaymentTransactions WHERE Status = 'Failed';

-- Check order status history
SELECT * FROM OrderStatusHistories ORDER BY CreatedAt DESC;
```

### Track API Performance

- Monitor response times
- Check error rates
- Review database query performance
- Monitor memory/CPU usage

## 🚢 Deployment Steps

1. **Build backend**

   ```bash
   dotnet publish -c Release
   ```

2. **Build frontend**

   ```bash
   npm run build
   ```

3. **Update configuration**
   - Set production Razorpay keys
   - Update database connection string
   - Configure API endpoint URL

4. **Deploy to server**
   - Upload built files
   - Run migrations
   - Restart services

5. **Test production**
   - Verify checkout flow
   - Test payment processing
   - Monitor logs

## 📚 Documentation Links

- **Full Guide:** `PAYMENT_SYSTEM_GUIDE.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **API Docs:** `/openapi/v1.json`
- **Cart Implementation:** `CART_IMPLEMENTATION.md`

## 🆘 Getting Help

1. Check the error message
2. Review `PAYMENT_SYSTEM_GUIDE.md`
3. Look at log files
4. Check database state
5. Contact support: support@trophybazaar.in

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Cart works (add/remove items)
- [ ] Checkout page loads
- [ ] Payment modal appears
- [ ] Order created in database
- [ ] Order confirmation page shows
- [ ] API endpoints respond correctly

---

**Last Updated:** January 15, 2024
**Status:** Ready for Development ✅
