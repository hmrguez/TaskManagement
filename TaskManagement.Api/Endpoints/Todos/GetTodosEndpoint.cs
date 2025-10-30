using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Api.Data;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Endpoints.Todos;

public class GetTodosEndpoint : Endpoint<GetTodosRequest, PagedTodosResponse>
{
    private readonly ApplicationDbContext _dbContext;

    public GetTodosEndpoint(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public override void Configure()
    {
        Get("/api/todos");
        AuthSchemes("Bearer");
    }

    public override async Task HandleAsync(GetTodosRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst("UserId")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var pageNumber = req.PageNumber ?? 1;
        var pageSize = req.PageSize ?? 10;

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _dbContext.Todos.Where(t => t.UserId == userId);

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var todos = await query
            .OrderBy(t => t.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TodoResponse
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                IsCompleted = t.IsCompleted,
                DueDate = t.DueDate,
                UserId = t.UserId
            })
            .ToListAsync(ct);

        await SendAsync(new PagedTodosResponse
        {
            Todos = todos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalPages
        }, cancellation: ct);
    }
}


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

