using Microsoft.AspNetCore.Identity;
using TaskManagement.Api.Features.Todos;

namespace TaskManagement.Api.Features.Auth;

public class User: IdentityUser
{
    // Navigation
    public ICollection<Todo> Todos { get; set; } = new List<Todo>();
}