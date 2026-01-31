using Microsoft.AspNetCore.Identity;
using SolidCharacters.Domain.DTO;
using SolidCharacters.Domain.Entities;

namespace SolidCharacters.Repository
{
    public interface IUserRepository
    {
        Task<int?> GetUserId();
        Task<User?> GetUser(string username);
        Task<User?> GetUserId(int id);
        string? GetUsername();
        Task<List<User>> GetAllUsers();
        Task<List<string>> GetRoles(string username);
        Task<List<string>> GetRoles(int id);
        void CreatePasswordHash(string password, out byte[] passHash, out byte[] passSalt);

        bool VerifyPasswordHash(string password, byte[] passHash, byte[] passSalt);
    }
}