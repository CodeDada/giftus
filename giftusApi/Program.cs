using giftusApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure Kestrel to allow larger uploads (500 MB)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 500 * 1024 * 1024; // 500 MB
});

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

// Apply CORS BEFORE HTTPS redirect so preflight requests work
app.UseCors("AllowAll");

// Only use HTTPS redirect in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Serve static files from wwwroot and resources directories
app.UseStaticFiles();

// Determine the resources path based on environment
string resourcesPath;
if (app.Environment.IsDevelopment())
{
    // Development: Look for resources in parent directories
    resourcesPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "resources");
}
else
{
    // Production: Use absolute path to shared resources folder
    resourcesPath = "/home/giftus/resources";
}

// Ensure the path exists
if (!Directory.Exists(resourcesPath))
{
    Directory.CreateDirectory(resourcesPath);
}

// Custom middleware to handle image URL normalization (with fallback for old filenames with spaces)
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/resources/images"))
    {
        var path = context.Request.Path.Value;
        var fullPath = Path.Combine(resourcesPath, path.Replace("/resources/", "").TrimStart('/'));

        // If file doesn't exist with hyphens, try with spaces
        if (!System.IO.File.Exists(fullPath) && path.Contains("-base."))
        {
            var pathWithSpaces = path.Replace("-base.", " base.");
            var fallbackPath = Path.Combine(resourcesPath, pathWithSpaces.Replace("/resources/", "").TrimStart('/'));

            if (System.IO.File.Exists(fallbackPath))
            {
                // Serve the file with spaces
                context.Request.Path = pathWithSpaces;
            }
        }
    }

    await next();
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(resourcesPath),
    RequestPath = "/resources"
});

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
