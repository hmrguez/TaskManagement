using TaskManagement.Api.Features.Auth;

namespace TaskManagement.Api.Features.Todos;

public class Todo
{
    public int Id { get; set; }
    public string Title { get; set; }
    public DateTime? DueDate { get; set; }
    public string Description { get; set; }
    public bool IsCompleted { get; set; }
    
    
    // Navigation
    public string UserId { get; set; }
    public User User { get; set; }
}