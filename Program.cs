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

builder.Services.AddTransient<IUserMapper,UserMapper>();
builder.Services.AddTransient<IUserRepository, UserRepository>();
builder.Services.AddTransient<ITokenRepository, TokenRepository>();

// ----- Add Database Stuff ----
var location = "localDefault";
// var location = "work";
var connString = builder.Configuration.GetConnectionString(location);
builder.Services.AddDbContext<SharpAngleContext>(options=>{
    options.EnableDetailedErrors(true);
    options.UseSqlServer(connString);
});

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase  = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredUniqueChars = 1;
    options.Password.RequiredLength = 6;

});


builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters{
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey= false,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    });
builder.Services.AddAuthorization(options => {
    options.AddPolicy("GuestPolicy", policy =>
    {
        policy.RequireRole("Guest", "User", "Admin");
    });
    options.AddPolicy("UserPolicy", policy =>
    {
        policy.RequireRole( "User", "Admin");
    });
    options.AddPolicy("AdminPolicy", policy =>
    {
        policy.RequireRole("Admin");
    });
});
builder.Services.AddHttpContextAccessor();

builder.WebHost.ConfigureServices(services =>
{
    services.AddSpaStaticFiles(configuration =>
    {
        configuration.RootPath = "wwwroot";
    });
    
});

builder.WebHost.ConfigureKestrel((context, options) =>
{
    // how to generate a https certificate run these two commands with your info.
    // mkcert <address>
    // openssl pkcs12 -export -out <mydomains>.pfx -inkey <example.com+5-key>.pem -in <example.com+5>.pem 
    options.ListenLocalhost(5000, listenOptions =>
    {
        listenOptions.UseHttps("nethost.pfx", "password");
    });
    options.Listen(System.Net.IPAddress.Parse("192.168.1.100"), 5000, listenOptions =>
    {
        listenOptions.UseHttps("nethost.pfx", "password");
    });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c=>{
    c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme {
        Description = "Example Value: bearer {token}",
        In=ParameterLocation.Header,
        Name="Authorization",
        Type = SecuritySchemeType.ApiKey
    });

    c.OperationFilter<SecurityRequirementsOperationFilter>();
});
// builder.WebHost.ConfigureKestrel((context, options)=>
// {
//     options.
// })
var app = builder.Build();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}



app.UseHttpsRedirection();
string path;
// if (false == true && app.Environment.IsDevelopment())
// {
//     path = Path.Combine(Directory.GetCurrentDirectory(), "client", "dist");
// }
// else
// {
// }
    path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
Console.WriteLine(path);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(path)
});
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();


app.UseEndpoints(endpoints =>
{
    endpoints.MapDefaultControllerRoute();
});

app.UseSpaStaticFiles();

app.UseSpa(spa =>
{
    spa.Options.SourcePath = "client";

    if (app.Environment.IsDevelopment())
    {
        // spa.UseReactDevelopmentServer(npmScript: "build");
        spa.UseProxyToSpaDevelopmentServer("http://192.168.1.100:3000/");
    } else {
        spa.Options.DefaultPage = "/index.html";
        spa.Options.DefaultPageStaticFileOptions = new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(path)
        };
    }
});

app.Run();
