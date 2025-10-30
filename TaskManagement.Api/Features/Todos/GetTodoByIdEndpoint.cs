using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Api.Data;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Features.Todos;

public class GetTodoByIdEndpoint(ApplicationDbContext dbContext) : Endpoint<EmptyRequest, TodoResponse>
{
    public override void Configure()
    {
        Get("/api/todos/{id}");
        AuthSchemes("Bearer");
    }

    public override async Task HandleAsync(EmptyRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst("userId")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var id = Route<int>("id");

        var todo = await dbContext.Todos
            .Where(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync(ct);

        if (todo == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendAsync(new TodoResponse
        {
            Id = todo.Id,
            Title = todo.Title,
            Description = todo.Description,
            IsCompleted = todo.IsCompleted,
            DueDate = todo.DueDate,
            UserId = todo.UserId
        }, cancellation: ct);
    }
}