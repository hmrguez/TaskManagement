using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Api.Data;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Features.Todos;

public class UpdateTodoEndpoint(ApplicationDbContext dbContext) : Endpoint<UpdateTodoRequest, TodoResponse>
{
    public override void Configure()
    {
        Put("/api/todos/{id}");
        AuthSchemes("Bearer");
    }

    public override async Task HandleAsync(UpdateTodoRequest req, CancellationToken ct)
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

        // Update only the fields that are provided
        if (!string.IsNullOrEmpty(req.Title))
            todo.Title = req.Title;

        if (req.Description != null)
            todo.Description = req.Description;

        if (req.IsCompleted.HasValue)
            todo.IsCompleted = req.IsCompleted.Value;

        if (req.DueDate.HasValue)
            todo.DueDate = req.DueDate;

        await dbContext.SaveChangesAsync(ct);

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

