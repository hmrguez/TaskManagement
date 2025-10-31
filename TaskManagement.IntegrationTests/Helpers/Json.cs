using System.Text.Json;

namespace TaskManagement.Api.IntegrationTests.Helpers;

public static class Json
{
    public static readonly JsonSerializerOptions Options = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };
}