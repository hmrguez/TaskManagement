using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Features.Auth;

public class SignUpEndpoint(UserManager<User> userManager, IJwtService jwtService)
    : Endpoint<SignUpRequest, SignUpResponse>
{
    public override void Configure()
    {
        Post("/auth/signup");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Register a new user";
            s.Description = "Creates a new user account and returns authentication token";
            s.Response<SignUpResponse>(200, "User created successfully");
            s.Response(400, "Invalid request data");
            s.Response(409, "User already exists");
        });
    }

    public override async Task HandleAsync(SignUpRequest req, CancellationToken ct)
    {
        // Check if user already exists
        var existingUser = await userManager.FindByEmailAsync(req.Email);
        if (existingUser != null)
        {
            await SendAsync(new SignUpResponse(), 409, ct);
            return;
        }

        // Create new user
        var user = new User
        {
            UserName = req.UserName,
            Email = req.Email,
            EmailConfirmed = true // For simplicity, we'll auto-confirm emails
        };

        var result = await userManager.CreateAsync(user, req.Password);
        
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                AddError(error.Description);
            }
            await SendErrorsAsync(400, ct);
            return;
        }

        // Generate JWT token
        var token = jwtService.GenerateToken(user);

        var response = new SignUpResponse
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email!,
            UserName = user.UserName!
        };

        await SendOkAsync(response, ct);
    }
}
