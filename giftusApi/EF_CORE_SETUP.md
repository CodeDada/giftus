# Entity Framework Core Setup for Giftus API

## Overview

This project uses **Entity Framework Core 10.0** with **SQL Server** to manage the Giftus e-commerce database.

## Entity Models

### 1. **Category**

- Represents product categories (e.g., Trophies, Awards, Gifts)
- Has many Products
- Fields: Id, Name, Slug, Description, IsActive, CreatedAt

### 2. **Product**

- Represents individual products with a specific ModelNo
- Belongs to one Category
- Has many ProductImages, ProductVariants, and OrderItems
- Fields: Id, CategoryId, ModelNo, Name, Slug, BaseImageUrl, VideoUrl, ShortDescription, GstPercent, IsCustomizable, IsActive, CreatedAt

### 3. **ProductImage**

- Stores multiple images for each product
- Belongs to one Product
- Fields: Id, ProductId, ImageUrl, SortOrder, CreatedAt

### 4. **ProductVariant**

- Represents product variants (sizes, colors, etc.) with different prices and stock
- Belongs to one Product
- Has many OrderItems
- Fields: Id, ProductId, VariantName, VariantValue, Price, StockQty

### 5. **Order**

- Represents customer orders (no authentication required)
- Has many OrderItems and Payments
- Fields: Id, OrderNumber, CustomerName, CustomerEmail, CustomerPhone, DeliveryAddress, Subtotal, GstAmount, TotalAmount, OrderStatus, CreatedAt

### 6. **OrderItem**

- Represents individual items in an order
- Links Order, Product, ProductVariant, and OrderCustomizations
- Fields: Id, OrderId, ProductId, VariantId, Quantity, Price

### 7. **OrderCustomization**

- Stores customization details for order items (engraving text, logo URL, etc.)
- Belongs to one OrderItem
- Fields: Id, OrderItemId, CustomizationKey, CustomizationValue

### 8. **Payment**

- Tracks payment information for orders
- Belongs to one Order
- Fields: Id, OrderId, PaymentGateway, PaymentId, PaymentStatus, Amount, CreatedAt

## Database Connection

### Connection String

```
Server=(local);Database=giftus;Trusted_Connection=true;TrustServerCertificate=true;
```

Configure in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(local);Database=giftus;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

### DbContext Registration

In `Program.cs`:

```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<GiftusDbContext>(options =>
    options.UseSqlServer(connectionString)
);
```

## API Endpoints

### Categories API (`/api/categories`)

#### GET all categories

```
GET /api/categories
```

Returns all active categories.

#### GET category by ID

```
GET /api/categories/{id}
```

Returns category with its products.

#### POST create category

```
POST /api/categories
Content-Type: application/json

{
  "name": "Trophies",
  "slug": "trophies",
  "description": "Trophy awards for competitions"
}
```

#### PUT update category

```
PUT /api/categories/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "isActive": true
}
```

#### DELETE category

```
DELETE /api/categories/{id}
```

## Common Queries

### Get products with variants and images

```csharp
var products = await _dbContext.Products
    .Include(p => p.Category)
    .Include(p => p.ProductVariants)
    .Include(p => p.ProductImages)
    .Where(p => p.IsActive)
    .OrderBy(p => p.Name)
    .ToListAsync();
```

### Get orders with items and customizations

```csharp
var orders = await _dbContext.Orders
    .Include(o => o.OrderItems)
        .ThenInclude(oi => oi.Product)
    .Include(o => o.OrderItems)
        .ThenInclude(oi => oi.OrderCustomizations)
    .Include(o => o.Payments)
    .OrderByDescending(o => o.CreatedAt)
    .ToListAsync();
```

### Update product stock

```csharp
var variant = await _dbContext.ProductVariants.FindAsync(variantId);
if (variant != null)
{
    variant.StockQty -= quantity;
    _dbContext.ProductVariants.Update(variant);
    await _dbContext.SaveChangesAsync();
}
```

## Key Features

- **Foreign Key Constraints**: Properly configured with appropriate cascade/restrict behaviors
- **Indexes**: Strategic indexes on frequently queried columns for performance
- **Unique Constraints**: Slug, ModelNo, OrderNumber are unique
- **Timestamps**: Automatic creation timestamps using SYSDATETIME()
- **Default Values**: Default values for status fields, GST percentage, etc.
- **Decimal Precision**: Proper decimal types for currency fields
- **Nullable Fields**: Optional fields for customer data

## Error Handling

All controllers include try-catch blocks and return appropriate HTTP status codes:

- **200 OK**: Successful GET/PUT/DELETE
- **201 Created**: Successful POST
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Future Enhancements

1. Add **repository pattern** for data access abstraction
2. Implement **unit of work pattern** for transaction management
3. Add **EF Core migrations** for schema versioning
4. Implement **soft deletes** for data retention
5. Add **audit logging** for data changes
6. Implement **pagination** for large datasets
7. Add **caching** for frequently accessed data
