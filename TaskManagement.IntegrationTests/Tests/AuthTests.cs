using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using TaskManagement.Api.IntegrationTests.Helpers;
using TaskManagement.IntegrationTests.Models;

namespace TaskManagement.IntegrationTests.Tests;

public class AuthTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _json = Json.Options;

    public AuthTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SignUp_Then_Login_Should_Succeed_And_Return_Token()
    {
        var client = _factory.CreateClient();
        var email = $"test+{Guid.NewGuid():N}@example.com";
        var password = "Test123!";
        var userName = $"user{Guid.NewGuid():N}";

        // SignUp
        var signUpResponse = await client.PostAsJsonAsync("/auth/signup", new SignUpRequest
        {
            Email = email,
            Password = password,
            UserName = userName
        });
        signUpResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var signUp = await signUpResponse.Content.ReadFromJsonAsync<SignUpResponse>(_json);
        signUp.Should().NotBeNull();
        signUp!.Token.Should().NotBeNullOrWhiteSpace();
        signUp.Email.Should().Be(email);
        signUp.UserName.Should().Be(userName);

        // Login
        var loginResponse = await client.PostAsJsonAsync("/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var login = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>(_json);
        login.Should().NotBeNull();
        login!.Token.Should().NotBeNullOrWhiteSpace();
        login.Email.Should().Be(email);
        login.UserName.Should().Be(userName);
    }

    [Fact]
    public async Task Invalid_Login_Should_Return_401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/auth/login", new LoginRequest
        {
            Email = "wrong@example.com",
            Password = "wrongpassword"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Duplicate_SignUp_Should_Return_409()
    {
        var client = _factory.CreateClient();
        var email = $"dup+{Guid.NewGuid():N}@example.com";
        var password = "Test123!";
        var userName = $"user{Guid.NewGuid():N}";

        var first = await client.PostAsJsonAsync("/auth/signup", new SignUpRequest
        {
            Email = email,
            Password = password,
            UserName = userName
        });
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        var second = await client.PostAsJsonAsync("/auth/signup", new SignUpRequest
        {
            Email = email,
            Password = password,
            UserName = userName + "2"
        });
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}