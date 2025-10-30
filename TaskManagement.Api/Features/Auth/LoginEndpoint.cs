using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Features.Auth;

public class LoginEndpoint : Endpoint<LoginRequest, LoginResponse>
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IJwtService _jwtService;

    public LoginEndpoint(UserManager<User> userManager, SignInManager<User> signInManager, IJwtService jwtService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
    }

    public override void Configure()
    {
        Post("/auth/login");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Authenticate user";
            s.Description = "Authenticates a user and returns a JWT token";
            s.Response<LoginResponse>(200, "Login successful");
            s.Response(401, "Invalid credentials");
            s.Response(400, "Invalid request data");
        });
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        // Find user by email
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
        {
            await SendAsync(new LoginResponse(), 401, ct);
            return;
        }

        // Check password
        var result = await _signInManager.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: false);
        if (!result.Succeeded)
        {
            await SendAsync(new LoginResponse(), 401, ct);
            return;
        }

        // Generate JWT token
        var token = _jwtService.GenerateToken(user);

        var response = new LoginResponse
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email!,
            UserName = user.UserName!
        };

        await SendOkAsync(response, ct);
    }
}
