using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using sharpAngleTemplate.CustomActionFilters;
using sharpAngleTemplate.data;
using sharpAngleTemplate.models;
using sharpAngleTemplate.models.entities;
using sharpAngleTemplate.Repositories;
using sharpAngleTemplate.tools;

namespace sharpAngleTemplate.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class UsersController : Controller
    {
        private readonly SharpAngleContext dbContext;
        private readonly IUserMapper UserMapper;
        private readonly ITokenRepository TokenRepo;
        private readonly IUserRepository userRepository;


        public UsersController(SharpAngleContext dbContext, IUserMapper UserMapper, ITokenRepository tokenRepo, IUserRepository userRepository)
        {
            this.dbContext = dbContext;
            this.UserMapper = UserMapper;
            this.TokenRepo = tokenRepo;
            this.userRepository = userRepository;

        }

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] UserRegisterReq user)
        {
            var userDb = dbContext.Users;
            var userDomain = await userDb.FirstOrDefaultAsync(u=>u.Username==user.Username);
            if (userDomain != null)
            {
                Console.WriteLine("\n Bad Request! \n");
                return BadRequest("User already Exists");
            }

            userRepository.CreatePasswordHash(user.Password, out byte[] passHash, out byte[] passSalt);
            // ------- change to something better proper roles ----
            // var roles = new List<string>(){"Guest"};
            var guestRole = new RoleEntity(){
                Role="Guest"
            };
            var userRole = new RoleEntity(){
                Role="User"
            };
            var adminRole = new RoleEntity(){
                Role="Admin"
            };
            var roles = new List<RoleEntity>(){
                guestRole
            };
            if (user.Username == "Admin")
            {
                roles.Add(userRole);
                roles.Add(adminRole);    
            }
            // var roles = new List<string>(){"Guest","User","Admin"};
            // ----------------------------------------------------
            var newUser = new models.entities.User(){
                Username=user.Username,
                PasswordHash=passHash,
                PasswordSalt=passSalt,
                Roles=roles,
                MoreData=user.MoreData
            };
            userDb.Add(newUser);

            Console.WriteLine("\n Ok! \n");
            await dbContext.SaveChangesAsync();
            return Ok();
        }

        [HttpPost]
        [Valid]
        public async Task<IActionResult> Login([FromBody] UserLoginReq user)
        {
            // Check if user exists
            Console.WriteLine($"\nLogin Request: {user.Stringify()} \n");
            var userEntity = await userRepository.GetUser(user.Username);
            if (userEntity != null)
            {
                // Check if password is correct
                if (userRepository.VerifyPasswordHash(user.Password, userEntity.PasswordHash, userEntity.PasswordSalt))
                {
                    Console.WriteLine("\nPassword Verified!\n");
                    var backup = new List<string>(){"Guest"};
                    var totalUserEntity = await dbContext.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Id == userEntity.Id);
                    List<string> rollin;
                    if (totalUserEntity != null)
                    {
                        rollin = totalUserEntity.Roles.Select(r => r.Role).ToList();
                    } else
                    {
                        rollin = userEntity.Roles.Select(r => r.Role).ToList();
                    }
                    if (rollin == null || rollin.Count() < 1)
                    {
                        rollin = backup;
                        Console.WriteLine($"\nBackup Used: ");
                    }
                    Console.WriteLine($"\n{rollin.Stringify()}");

                    string token = TokenRepo.CreateJWTToken(userEntity, rollin);
                    var BuildTokenJson = (string token)=>{
                        if (string.IsNullOrEmpty(token) == false)
                        {
                            
                            return token;
                        }
                        return string.Empty;
                    };
                    var tokenJSON = BuildTokenJson(token).SendAsJson();
                    Console.WriteLine($"\n Ok! sending: {tokenJSON} \n");
                    return Ok(tokenJSON);
                        // return new ContentResult() { Content = token, StatusCode = 200 };
                }
                Console.WriteLine("\nPassword Verification Failed!\n ");
            }
            Console.WriteLine("\n Bad Request! \n");
            // Info is wrong
            return BadRequest("Incorrect Username or Password".SendAsJson());
        }

        [HttpPost]
        public async Task<IActionResult> Verify()
        {
            var userId = await userRepository.GetUserId();
            if (userId == null)
            {
                Console.WriteLine("- \n Failed To find UserID for Verification! \n -");
            } else {
                Console.WriteLine($"- \n UserID: {userId} \n -");
            }
            if (userId != null)
            {

                var userToSend = await userRepository.GetUserId((int)userId);
                Console.WriteLine($"- \n userToSend UserID: {userToSend?.Id} \n -");

                if (userToSend != null)
                {
                    return Ok(UserMapper.MapUser(userToSend).SendAsJson());
                } else
                {
                    var username = userRepository.GetUsername();
                    if (username != null)
                    {
                        var userEntity = await userRepository.GetUser(username);
                        Console.WriteLine($"- \n username: {username}, {userEntity?.Username}\n -");

                        if (userEntity != null)
                        {
                            var userDomainJson = UserMapper.MapUser(userEntity).SendAsJson();
                            Console.WriteLine($"-\nOk sent! sending: {userDomainJson}\n-");
                            return Ok(userDomainJson);
                        }
                    }
                }
                Console.WriteLine("-\nBadRequest sent!\n-");
                return BadRequest("No user was found!".SendAsJson());
            } else {
                Console.WriteLine("-\nUnauthorized sent!\n-");
                return Unauthorized();
            }
        }

        [HttpPost]
        [Authorize(Policy = "GuestPolicy")]
        public async Task<IActionResult> VerifyGuest(){
            return Ok();
        }

        [HttpPost]
        [Authorize(Policy = "UserPolicy")]
        public async Task<IActionResult> VerifyUser(){
            return Ok();
        }
        
        [HttpPost]
        [Authorize(Policy = "AdminPolicy")]
        public async Task<IActionResult> VerifyAdmin(){
            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> Get([FromBody] UserGetReq user)
        {
            if (user.Username != null)
            {
                var send = await userRepository.GetUser(user.Username);
                if (send != null)
                {
                    return Ok(UserMapper.MapUser(send).SendAsJson());
                }
            }
            return NotFound("No user was found".SendAsJson());
        }

        [HttpPut]
        [Authorize(Policy = "GuestPolicy")]
        public async Task<IActionResult> Update([FromBody] UserUpdateReq user)
        {
            var userId = await userRepository.GetUserId();
            User? userEntity;
            if (userId != null)
            {
                userEntity = await userRepository.GetUserId((int)userId);
                if (userEntity == null)
                {
                    return NotFound();
                }
                if (user.Username != null)
                {
                    userEntity.Username = user.Username;
                }
                // Need to ReEncrypt
                // if (user.Password != null)
                // {
                //     userDomain.Password = user.Password;
                // }

                if (user.MoreData != null)
                {
                    userEntity.MoreData = user.MoreData;
                }
                dbContext.SaveChanges();

                return Ok(UserMapper.MapUser(userEntity).SendAsJson());
            } else
            {
                return Unauthorized();
            }
        }

        [HttpDelete]
        [Authorize(Policy = "AdminPolicy")]
        public async Task<IActionResult> Delete([FromBody] DeleteUserReq user)
        {
            var userDb = dbContext.Users;
            var userEntity = await userRepository.GetUser(user.Username.SendAsJson());
            if (userEntity == null)
            {
                return NotFound();
            }
            userDb.Remove(userEntity);
            dbContext.SaveChanges();

            return Ok();
        }
    }
}