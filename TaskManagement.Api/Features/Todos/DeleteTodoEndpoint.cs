using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Api.Data;

namespace TaskManagement.Api.Features.Todos;

public class DeleteTodoEndpoint(ApplicationDbContext dbContext) : Endpoint<EmptyRequest>
{
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

        var todo = await dbContext.Todos
            .Where(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync(ct);

        if (todo == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        dbContext.Todos.Remove(todo);
        await dbContext.SaveChangesAsync(ct);

        await SendNoContentAsync(ct);
    }
}