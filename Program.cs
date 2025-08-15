using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using sharpAngleTemplate.tools;
using sharpAngleTemplate.data;
using Microsoft.EntityFrameworkCore;
using sharpAngleTemplate.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Swashbuckle.AspNetCore.Filters;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using sharpAngleTemplate.models.repositories;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.HttpOverrides; // forwarded headers
using Microsoft.AspNetCore.ResponseCompression; // compression
using System.IO.Compression; // compression levels
using System.Net; // proxy IPs

var builder = WebApplication.CreateBuilder(args);
var runningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

//------------- Add services to the container.-------------
builder.Services.AddControllers();

builder.Services.AddSingleton<IDbJsonService, DbJsonService>();
builder.Services.AddSingleton<IDndInfoRepository, DndInfoRepository>();

builder.Services.AddTransient<IUserMapper, UserMapper>();
builder.Services.AddTransient<IUserRepository, UserRepository>();
builder.Services.AddTransient<ITokenRepository, TokenRepository>();
builder.Services.AddTransient<ISrdInfoRepository, SrdInfoRepository>();

// ----- Add Database Stuff ----
// Select which named connection string to use (default localDefault). Override in container with env var DB_CONNECTION_NAME=work
var location = Environment.GetEnvironmentVariable("DB_CONNECTION_NAME") ?? "localDefault"; // or "work"
var connString = builder.Configuration.GetConnectionString(location);
builder.Services.AddDbContext<SharpAngleContext>(options =>
{
    options.EnableDetailedErrors(true);
    options.UseSqlServer(connString);
});

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredUniqueChars = 1;
    options.Password.RequiredLength = 6;
});

// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
//     {
//         ValidateIssuer = false,
//         ValidateAudience = false,
//         ValidateLifetime = true,
//         ValidateIssuerSigningKey = false,
//         ValidIssuer = builder.Configuration["Jwt:Issuer"],
//         ValidAudience = builder.Configuration["Jwt:Audience"],
//         IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
//     });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("GuestPolicy", policy =>
        policy.RequireRole("Guest", "User", "Admin"));
    options.AddPolicy("UserPolicy", policy =>
        policy.RequireRole("User", "Admin"));
    options.AddPolicy("AdminPolicy", policy =>
        policy.RequireRole("Admin"));
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddSpaStaticFiles(config =>
{
    config.RootPath = "client/dist";
});

// Response compression (helps JSON/API; Cloudflare can still re-compress)
builder.Services.AddResponseCompression(o =>
{
    o.EnableForHttps = true;
    o.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<GzipCompressionProviderOptions>(o =>
{
    o.Level = CompressionLevel.Fastest;
});

// Forwarded headers (Cloudflare / reverse proxy)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Trust Docker bridge / reverse proxy IP if needed
    options.KnownProxies.Add(IPAddress.Parse("172.17.0.1"));
});

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        Description = "Example Value: bearer {token}",
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });
    c.OperationFilter<SecurityRequirementsOperationFilter>();
});
// how to generate a https certificate run these two commands with your info.
// mkcert <spaced apart addresses>
// openssl pkcs12 -export -out <mydomains>.pfx -inkey <example.com+5-key>.pem -in <example.com+5>.pem 
// Kestrel Configuration
// For local dev we keep explicit HTTPS bindings.
// In container we expose a simple HTTP port (8080) and rely on reverse proxy / platform TLS termination.
builder.WebHost.ConfigureKestrel((context, options) =>
{
    // Allow overriding port with PORT env (common in container platforms)
    var portStr = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    if (!int.TryParse(portStr, out var port)) port = 8080;

    if (runningInContainer)
    {
        // Only HTTP inside container (TLS handled by Cloudflare / reverse proxy)
        options.ListenAnyIP(port);
    }
    else
    {
        // Local dev HTTPS endpoints
        options.ListenLocalhost(5000, listenOptions =>
        {
            listenOptions.UseHttps("nethost.pfx", "password");
        });
        // Optionally keep LAN binding while developing on network
        options.Listen(System.Net.IPAddress.Parse("192.168.1.100"), 5000, listenOptions =>
        {
            listenOptions.UseHttps("nethost.pfx", "password");
        });
    }
});

var app = builder.Build();

// Trust proxy headers early (before redirection, auth)
app.UseForwardedHeaders();

// Configure the HTTP request pipeline

if (app.Environment.IsDevelopment())
{
    // 1. Developer exception page
    app.UseDeveloperExceptionPage();

    // 2. Swagger middleware
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Production hardening
    app.UseResponseCompression();
    app.UseHsts(); // instruct browsers to use HTTPS (works with Cloudflare forwarding)
    app.Use(async (ctx, next) =>
    {
        ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
        ctx.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
        ctx.Response.Headers["X-XSS-Protection"] = "0"; // modern browsers ignore; set for legacy completeness
        await next();
    });
}

// 3. Redirect HTTP to HTTPS (skip inside container when only HTTP is configured)
// Only redirect locally where we terminate TLS ourselves
if (!runningInContainer && app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 4. Static file serving
//    - first: any custom physical files
string path = Path.Combine(Directory.GetCurrentDirectory(), "client", "dist");
Console.WriteLine($"Serving static files from: {path}");
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(path),
    OnPrepareResponse = ctx =>
    {
        // Cache static assets (adjust duration as needed)
        var headers = ctx.Context.Response.Headers;
        headers["Cache-Control"] = "public,max-age=604800"; // 7 days
    }
});
//    - then: SPA static files
app.UseSpaStaticFiles();

// 5. Routing setup
app.UseRouting();

// 6. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// 7. Map API controllers (protected by your policies as needed)
app.MapControllers();

// 8. SPA fallback / proxy
// Development: proxy to Vite/Solid dev server
if (app.Environment.IsDevelopment())
{
    app.UseSpa(spa =>
    {
        spa.Options.SourcePath = "client";
        spa.UseProxyToSpaDevelopmentServer("http://localhost:3000");
    });
}
else
{
    // Production SPA fallback: serve pre-built index.html from client/dist
    app.UseSpa(spa => { spa.Options.SourcePath = "client"; });
}


// 9. Fallback to index.html for client‑side routing (after controllers). For production built assets.
// Production fallback handled by UseSpa above (SpaDefaultPageMiddleware). No explicit MapFallbackToFile needed.

app.Run();
