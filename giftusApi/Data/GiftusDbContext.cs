using giftusApi.Models;
using Microsoft.EntityFrameworkCore;

namespace giftusApi.Data;

public class GiftusDbContext : DbContext
{
    public GiftusDbContext(DbContextOptions<GiftusDbContext> options) : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<OrderCustomization> OrderCustomizations { get; set; }
    public DbSet<Payment> Payments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
        });

        // Configure Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ModelNo).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.ModelNo).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.BaseImageUrl).HasMaxLength(500);
            entity.Property(e => e.VideoUrl).HasMaxLength(500);
            entity.Property(e => e.ShortDescription).HasMaxLength(500);
            entity.Property(e => e.GstPercent).HasColumnType("decimal(5,2)").HasDefaultValue(18.00m);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
            
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(e => e.CategoryId);
        });

        // Configure ProductImage
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
            
            entity.HasOne(e => e.Product)
                .WithMany(p => p.ProductImages)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.ProductId);
        });

        // Configure ProductVariant
        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VariantName).IsRequired().HasMaxLength(50).HasDefaultValue("Size");
            entity.Property(e => e.VariantValue).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
            
            entity.HasOne(e => e.Product)
                .WithMany(p => p.ProductVariants)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(new[] { "ProductId", "VariantName", "VariantValue" })
                .IsUnique()
                .HasDatabaseName("UQ_ProductVariant");
        });

        // Configure Order
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.Property(e => e.CustomerName).HasMaxLength(150);
            entity.Property(e => e.CustomerEmail).HasMaxLength(150);
            entity.Property(e => e.CustomerPhone).HasMaxLength(20);
            entity.Property(e => e.Subtotal).HasColumnType("decimal(10,2)");
            entity.Property(e => e.GstAmount).HasColumnType("decimal(10,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(10,2)");
            entity.Property(e => e.OrderStatus).IsRequired().HasMaxLength(50).HasDefaultValue("PENDING");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
            
            entity.HasIndex(e => e.OrderStatus);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure OrderItem
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
            
            entity.HasOne(e => e.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.ProductVariant)
                .WithMany(pv => pv.OrderItems)
                .HasForeignKey(e => e.VariantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure OrderCustomization
        modelBuilder.Entity<OrderCustomization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CustomizationKey).IsRequired().HasMaxLength(100);
            
            entity.HasOne(e => e.OrderItem)
                .WithMany(oi => oi.OrderCustomizations)
                .HasForeignKey(e => e.OrderItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PaymentGateway).HasMaxLength(50);
            entity.Property(e => e.PaymentId).HasMaxLength(200);
            entity.Property(e => e.PaymentStatus).HasMaxLength(50);
            entity.Property(e => e.Amount).HasColumnType("decimal(10,2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
            
            entity.HasOne(e => e.Order)
                .WithMany(o => o.Payments)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
