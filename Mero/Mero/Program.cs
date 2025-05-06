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

builder.Services.AddDbContext<MeroContext>();//��������� �������� ���� ������ EventContext ��� ������

builder.Services.AddIdentity<User, IdentityRole>()
.AddEntityFrameworkStores<MeroContext>();//��������� ��������� �������������� � �����������
builder.Services.AddControllers().AddJsonOptions(x =>
x.JsonSerializerOptions.ReferenceHandler =
ReferenceHandler.IgnoreCycles);//������������� ����������� ������ � �������� ��� ������������


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();//��������� API Explorer
builder.Services.AddSwaggerGen();//��������� Swagger

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
    // ���������� 401 ��� ������ ����������� ������� ��� ����
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

app.UseHttpsRedirection(); //��������������� �������� � HTTP �� HTTPS, ������������ ���������� ���������� ����� �������� � ��������
app.UseCors();
app.UseAuthentication();//��������� �������������� � ����������
app.UseAuthorization();//��������� ����������� � ����������

app.MapControllers();

app.Run();
