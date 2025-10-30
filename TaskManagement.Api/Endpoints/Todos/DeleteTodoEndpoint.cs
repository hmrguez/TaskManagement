using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Api.Data;

namespace TaskManagement.Api.Endpoints.Todos;

public class DeleteTodoEndpoint : Endpoint<EmptyRequest>
{
    private readonly ApplicationDbContext _dbContext;

    public DeleteTodoEndpoint(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public override void Configure()
    {
        Delete("/api/todos/{id}");
        AuthSchemes("Bearer");
    }

    public override async Task HandleAsync(EmptyRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst("UserId")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var id = Route<int>("id");

        var todo = await _dbContext.Todos
            .Where(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync(ct);

        if (todo == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        _dbContext.Todos.Remove(todo);
        await _dbContext.SaveChangesAsync(ct);

        await SendNoContentAsync(ct);
    }
}