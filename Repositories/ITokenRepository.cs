using Microsoft.AspNetCore.Identity;
using sharpAngleTemplate.models.entities;

namespace sharpAngleTemplate.Repositories
{
    public interface ITokenRepository {
        string CreateJWTToken(User user, List<string>? roles = null);
    }
}