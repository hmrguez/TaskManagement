using FastEndpoints;
using TaskManagement.Api.Data;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Endpoints.Todos;

public class CreateTodoEndpoint : Endpoint<CreateTodoRequest, TodoResponse>
{
    private readonly ApplicationDbContext _dbContext;

    public CreateTodoEndpoint(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public override void Configure()
    {
        Post("/api/todos");
        AuthSchemes("Bearer");
    }

    public override async Task HandleAsync(CreateTodoRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst("UserId")?.Value;

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

        _dbContext.Todos.Add(todo);
        await _dbContext.SaveChangesAsync(ct);

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