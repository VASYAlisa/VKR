using Mero.Data;
using Mero.Models;
using Microsoft.AspNetCore.Identity;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        builder =>
        {
            builder.WithOrigins("http://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
        });
});

builder.Services.AddDbContext<MeroContext>();//Добавляет контекст базы данных EventContext как сервис

builder.Services.AddIdentity<User, IdentityRole>()
.AddEntityFrameworkStores<MeroContext>();//Добавляет поддержку аутентификации и авторизации
builder.Services.AddControllers().AddJsonOptions(x =>
x.JsonSerializerOptions.ReferenceHandler =
ReferenceHandler.IgnoreCycles);//игнорирование циклических ссылок в объектах при сериализации


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();//поддержка API Explorer
builder.Services.AddSwaggerGen();//поддержка Swagger

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "MeroApp";
    options.LoginPath = "/";
    options.AccessDeniedPath = "/";
    options.LogoutPath = "/";
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    // Возвращать 401 при вызове недоступных методов для роли
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
});

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var eventContext =
    scope.ServiceProvider.GetRequiredService<MeroContext>();

    await MeroContextSeed.SeedAsync(eventContext);
    await IdentitySeed.CreateUserRoles(scope.ServiceProvider);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection(); //перенаправление запросов с HTTP на HTTPS, обеспечивает безопасное соединение между клиентом и сервером
app.UseCors();
app.UseAuthentication();//включение аутентификации в приложении
app.UseAuthorization();//включение авторизации в приложении

app.MapControllers();

app.Run();
