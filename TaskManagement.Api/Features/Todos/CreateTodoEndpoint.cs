using FastEndpoints;
using TaskManagement.Api.Data;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Features.Todos;

public class CreateTodoEndpoint(ApplicationDbContext dbContext) : Endpoint<CreateTodoRequest, TodoResponse>
{
    public override void Configure()
    {
        Post("/api/todos");
        AuthSchemes("Bearer");
    }

    public override async Task HandleAsync(CreateTodoRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst("userId")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var todo = new Todo
        {
            Title = req.Title,
            Description = req.Description,
            DueDate = req.DueDate,
            UserId = userId,
            IsCompleted = false
        };

        dbContext.Todos.Add(todo);
        await dbContext.SaveChangesAsync(ct);

        await SendAsync(new TodoResponse
        {
            Id = todo.Id,
            Title = todo.Title,
            Description = todo.Description,
            IsCompleted = todo.IsCompleted,
            DueDate = todo.DueDate,
            UserId = todo.UserId
        }, 201, ct);
    }
}