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
using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Endpoints.Auth;

public class SignUpEndpoint : Endpoint<SignUpRequest, SignUpResponse>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public SignUpEndpoint(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public override void Configure()
    {
        Post("/api/auth/signup");
        AllowAnonymous();
    }

    public override async Task HandleAsync(SignUpRequest req, CancellationToken ct)
    {
        var user = new ApplicationUser
        {
            Email = req.Email,
            UserName = req.UserName,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, req.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            await SendAsync(new SignUpResponse(), 400, ct);
            ThrowError(string.Join(", ", errors));
            return;
        }

        await SendAsync(new SignUpResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            UserName = user.UserName!
        }, 201, ct);
    }
}

