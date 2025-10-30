using FastEndpoints;
using FastEndpoints.Security;
using Microsoft.AspNetCore.Identity;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Endpoints.Auth;

public class LoginEndpoint : Endpoint<LoginRequest, LoginResponse>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public LoginEndpoint(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);

        if (user == null || !await _userManager.CheckPasswordAsync(user, req.Password))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var jwtSecret = _configuration["JwtSettings:Secret"] ?? "MySecretKeyForJWTAuthentication1234567890";
        
        var token = JwtBearer.CreateToken(
            signingKey: jwtSecret,
            expireAt: DateTime.UtcNow.AddDays(1),
            claims: new[]
            {
                ("UserId", user.Id),
                ("Email", user.Email!),
                ("UserName", user.UserName!)
            });

        await SendAsync(new LoginResponse
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email!,
            UserName = user.UserName!
        }, cancellation: ct);
    }
}

