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

var builder = WebApplication.CreateBuilder(args);

//------------- Add services to the container.-------------
builder.Services.AddControllers();

builder.Services.AddSingleton<IDbJsonService, DbJsonService>();
builder.Services.AddSingleton<IDndInfoRepository, DndInfoRepository>();

builder.Services.AddTransient<IUserMapper, UserMapper>();
builder.Services.AddTransient<IUserRepository, UserRepository>();
builder.Services.AddTransient<ITokenRepository, TokenRepository>();

// ----- Add Database Stuff ----
var location = "localDefault";
// var location = "work";
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

builder.WebHost.ConfigureKestrel((context, options) =>
{
    options.ListenLocalhost(5000, listenOptions =>
    {
        listenOptions.UseHttps("nethost.pfx", "password");
    });
    options.Listen(System.Net.IPAddress.Parse("192.168.1.100"), 5000, listenOptions =>
    {
        listenOptions.UseHttps("nethost.pfx", "password");
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline

if (app.Environment.IsDevelopment())
{
    // 1. Developer exception page
    app.UseDeveloperExceptionPage();

    // 2. Swagger middleware
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 3. Redirect HTTP to HTTPS
app.UseHttpsRedirection();

// 4. Static file serving
//    - first: any custom physical files
string path = Path.Combine(Directory.GetCurrentDirectory(), "client", "dist");
Console.WriteLine($"Serving static files from: {path}");
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(path)
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
// app.UseSpa(spa =>
// {
//     spa.Options.SourcePath = "client";
//     if (app.Environment.IsDevelopment())
//     {
//         // proxy to your React/Angular/Vue dev server
//         spa.UseProxyToSpaDevelopmentServer("http://192.168.1.100:3000");
//     }
//     // in production, it will serve files from client/dist
// });
app.MapWhen(ctx => !ctx.Request.Path.StartsWithSegments("/api"), spaApp =>
{
    spaApp.UseSpa(spa =>
    {
        spa.Options.SourcePath = "client";
        if (app.Environment.IsDevelopment())
        {
            spa.UseProxyToSpaDevelopmentServer("http://localhost:3000");
        }
    });
});


// 9. (Optional) Fallback to index.html for client‐side routing
// app.MapFallbackToFile("client/dist/index.html");

app.Run();
