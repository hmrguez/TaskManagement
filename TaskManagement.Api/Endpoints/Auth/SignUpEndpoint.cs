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