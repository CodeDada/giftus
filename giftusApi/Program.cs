using giftusApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Configure Entity Framework Core with SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=(local);Database=giftus;Trusted_Connection=true;TrustServerCertificate=true;";

builder.Services.AddDbContext<GiftusDbContext>(options =>
    options.UseSqlServer(connectionString)
);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.MapControllers();

// Welcome endpoint
app.MapGet("/", () => new
{
    message = "Welcome to Giftus API",
    version = "1.0.0",
    endpoints = new
    {
        helloWorld = "/api/helloworld",
        health = "/api/helloworld/health",
        documentation = "/openapi/v1.json"
    }
}).WithName("Welcome");

app.Run();
