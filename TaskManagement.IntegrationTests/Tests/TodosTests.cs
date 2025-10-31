using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Linq;
using FluentAssertions;
using TaskManagement.Api.IntegrationTests.Helpers;
using TaskManagement.IntegrationTests;
using TaskManagement.IntegrationTests.Helpers;
using TaskManagement.IntegrationTests.Models;
using Xunit;

namespace TaskManagement.Api.IntegrationTests.Tests;

public class TodosTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _json = Json.Options;

    public TodosTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Unauthorized_Request_Should_Return_401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/todos");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Todos_CRUD_Flow_Works()
    {
        // Arrange: create authorized client
        var (client, token, email) = await TestClientFactory.CreateAuthorizedClientAsync(_factory, _json);

        // 1) Create Todo #1
        var t1Resp = await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest
        {
            Title = "Complete project documentation",
            Description = "Write comprehensive documentation for the task management API",
            DueDate = DateTime.UtcNow.AddDays(10).Date
        });
        t1Resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var t1 = await t1Resp.Content.ReadFromJsonAsync<TodoResponse>(_json);
        t1.Should().NotBeNull();

        // 2) Create Todo #2 - without due date
        var t2Resp = await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest
        {
            Title = "Review code",
            Description = "Review pull requests and provide feedback"
        });
        t2Resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var t2 = await t2Resp.Content.ReadFromJsonAsync<TodoResponse>(_json);
        t2.Should().NotBeNull();

        // 3) Create Todo #3 - urgent
        var t3Resp = await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest
        {
            Title = "Fix critical bug",
            Description = "Investigate and fix the authentication issue reported by users",
            DueDate = DateTime.UtcNow.AddDays(1).Date
        });
        t3Resp.StatusCode.Should().Be(HttpStatusCode.Created);
        var t3 = await t3Resp.Content.ReadFromJsonAsync<TodoResponse>(_json);
        t3.Should().NotBeNull();

        // 4) Get All Todos - default pagination
        var listResp = await client.GetAsync("/api/todos");
        listResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var list = await listResp.Content.ReadFromJsonAsync<PagedTodosResponse>(_json);
        list.Should().NotBeNull();
        list!.Todos.Count.Should().BeGreaterOrEqualTo(3);
        list.TotalCount.Should().BeGreaterOrEqualTo(3);
        list.PageNumber.Should().Be(1);
        list.PageSize.Should().Be(10);

        // 5) Get All Todos - with pagination
        var pagedResp = await client.GetAsync("/api/todos?pageNumber=1&pageSize=2");
        pagedResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var paged = await pagedResp.Content.ReadFromJsonAsync<PagedTodosResponse>(_json);
        paged.Should().NotBeNull();
        paged!.Todos.Count.Should().BeLessOrEqualTo(2);
        paged.PageSize.Should().Be(2);

        // 6) Get Todo by ID
        var getByIdResp = await client.GetAsync($"/api/todos/{t1!.Id}");
        getByIdResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var byId = await getByIdResp.Content.ReadFromJsonAsync<TodoResponse>(_json);
        byId!.Id.Should().Be(t1.Id);
        byId.Title.Should().Be(t1.Title);

        // 7) Update Todo - mark as completed
        var updateCompletedResp = await client.PutAsJsonAsync($"/api/todos/{t1.Id}", new UpdateTodoRequest
        {
            IsCompleted = true
        });
        updateCompletedResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated1 = await updateCompletedResp.Content.ReadFromJsonAsync<TodoResponse>(_json);
        updated1!.IsCompleted.Should().BeTrue();

        // 8) Update Todo - title and description
        var updateTextResp = await client.PutAsJsonAsync($"/api/todos/{t2!.Id}", new UpdateTodoRequest
        {
            Title = "Review code and merge PRs",
            Description = "Review all pending pull requests, provide feedback, and merge approved ones",
            IsCompleted = false
        });
        updateTextResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated2 = await updateTextResp.Content.ReadFromJsonAsync<TodoResponse>(_json);
        updated2!.Title.Should().Contain("merge PRs");
        updated2.IsCompleted.Should().BeFalse();

        // 9) Update Todo - change due date
        var newDueDate = DateTime.UtcNow.AddDays(2).Date;
        var updateDateResp = await client.PutAsJsonAsync($"/api/todos/{t3!.Id}", new UpdateTodoRequest
        {
            DueDate = newDueDate
        });
        updateDateResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated3 = await updateDateResp.Content.ReadFromJsonAsync<TodoResponse>(_json);
        updated3!.DueDate!.Value.Date.Should().Be(newDueDate);

        // 10) Get All Todos After Updates
        var listAfterResp = await client.GetAsync("/api/todos");
        listAfterResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var listAfter = await listAfterResp.Content.ReadFromJsonAsync<PagedTodosResponse>(_json);
        listAfter!.TotalCount.Should().BeGreaterOrEqualTo(3);

        // 11) Delete a Todo
        var deleteResp = await client.DeleteAsync($"/api/todos/{t1.Id}");
        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 12) Verify Deletion - Get all todos again
        var listAfterDeleteResp = await client.GetAsync("/api/todos");
        listAfterDeleteResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var listAfterDelete = await listAfterDeleteResp.Content.ReadFromJsonAsync<PagedTodosResponse>(_json);
        listAfterDelete!.TotalCount.Should().BeGreaterOrEqualTo(2);
        listAfterDelete.Todos.Any(x => x.Id == t1.Id).Should().BeFalse();

        // 13) Error Cases - Get non-existent
        var notFoundGet = await client.GetAsync("/api/todos/999");
        notFoundGet.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // 14) Error Cases - Update non-existent
        var notFoundPut = await client.PutAsJsonAsync("/api/todos/999", new { Title = "This should fail" });
        notFoundPut.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // 15) Error Cases - Delete non-existent
        var notFoundDel = await client.DeleteAsync("/api/todos/999");
        notFoundDel.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}