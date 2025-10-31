using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Memory;
using Microsoft.Extensions.DependencyInjection;
using TaskManagement.Api.Data;

namespace TaskManagement.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((ctx, configBuilder) =>
        {
            var inMemorySettings = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=TestDb;Username=test;Password=test", // placeholder, will be replaced by InMemory provider
                ["Jwt:SecretKey"] = "this_is_a_test_secret_key_for_jwt_which_is_long_enough",
                ["Jwt:Issuer"] = "TaskManagement.Api.Tests",
                ["Jwt:Audience"] = "TaskManagement.Api.Tests"
            };
            // Ensure our test settings take precedence over any appsettings.* files
            // configBuilder.Sources.Clear();
            var memSource = new MemoryConfigurationSource { InitialData = inMemorySettings! };
            // configBuilder.AddInMemoryCollection(inMemorySettings!);
            configBuilder.Sources.Insert(0, memSource);
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registrations (Npgsql) to avoid multiple providers
            var descriptorsToRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                    d.ServiceType == typeof(ApplicationDbContext) ||
                    d.ServiceType == typeof(IDbContextFactory<ApplicationDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions))
                .ToList();

            foreach (var d in descriptorsToRemove)
            {
                services.Remove(d);
            }

            // Build isolated EF provider for InMemory to avoid cross-provider conflicts
            var efProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            // Register InMemory DbContext with isolated internal service provider
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("TaskManagement_TestDb");
                options.UseInternalServiceProvider(efProvider);
            });

            // Build the service provider to ensure the database is created
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
        });
    }
}