using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using TaskManagement.IntegrationTests.Models;

namespace TaskManagement.IntegrationTests.Helpers;

public static class TestClientFactory
{
    public static async Task<(HttpClient Client, string Token, string Email)> CreateAuthorizedClientAsync(CustomWebApplicationFactory factory, JsonSerializerOptions json)
    {

        var client = factory.CreateClient();
        var email = $"it+{Guid.NewGuid():N}@example.com";
        var password = "Test123!";
        var userName = $"user{Guid.NewGuid():N}";
        
        var signUpResponse = await client.PostAsJsonAsync("/auth/signup", new SignUpRequest
        {
            Email = email,
            Password = password,
            UserName = userName
        });
        signUpResponse.EnsureSuccessStatusCode();
        var signUp = await signUpResponse.Content.ReadFromJsonAsync<SignUpResponse>(json);
        // Perform a login to obtain a fresh token validated through the normal credentials flow
        var loginResponse = await client.PostAsJsonAsync("/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });
        loginResponse.EnsureSuccessStatusCode();
        var login = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>(json);
        var token = login!.Token;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return (client, token, email);
    }
}