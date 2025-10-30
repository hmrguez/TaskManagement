using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Api.Data;
using TaskManagement.Api.Models;

namespace TaskManagement.Api.Features.Todos;

public class GetTodosEndpoint(ApplicationDbContext dbContext) : Endpoint<GetTodosRequest, PagedTodosResponse>
{
    public override void Configure()
    {
        Get("/api/todos");
        AuthSchemes("Bearer");
    }

    public override async Task HandleAsync(GetTodosRequest req, CancellationToken ct)
    {
        var userId = User.FindFirst("userId")?.Value;

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

        var query = dbContext.Todos.Where(t => t.UserId == userId);

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var todos = await query
            .OrderBy(t => t.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Where(x => x.Title.Contains(req.SearchText) || x.Description.Contains(req.SearchText))
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