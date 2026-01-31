using Microsoft.AspNetCore.Identity;
using SolidCharacters.Domain.Entities;

namespace SolidCharacters.Repository
{
    public interface ITokenRepository {
        string CreateJWTToken(User user, List<string>? roles = null);
    }
}