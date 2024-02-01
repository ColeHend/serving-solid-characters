using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using sharpAngleTemplate.models.entities;

namespace sharpAngleTemplate.Repositories
{
    public class TokenRepository : ITokenRepository
    {
        private readonly IConfiguration configuration;
        public TokenRepository(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public string? CreateJWTToken(User user, List<string>? roles = null)
        {
            if (string.IsNullOrEmpty(user.Username) == false)
            {
                
            var claims = new List<Claim>(){
                new Claim(ClaimTypes.Name, user.Username)
            };
            if (roles == null)
            {
                claims.Add(new Claim(ClaimTypes.Role,"Guest"));
            } else {
                foreach (var role in roles)
                {
                    if (string.IsNullOrEmpty(role) == false)
                    {
                        claims.Add(new Claim(ClaimTypes.Role,role));
                    }
                }
                if (claims.Count() == 1)
                {
                    claims.Add(new Claim(ClaimTypes.Role,"Guest"));
                }
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);


            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(15),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
            }else {
                return null;
            }
        }
    }
}