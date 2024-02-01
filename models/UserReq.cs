using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace sharpAngleTemplate.models
{
    public class UserRegisterReq
    {
        [Required]
        [MinLength(3,ErrorMessage = "Username not long enough!")]
        public string Username { get; set; }

        [Required]
        [MinLength(8,ErrorMessage = "Password not long enough!")]
        public string Password { get; set; }
        public string MoreData { get; set; } = String.Empty;
    }
    public class UserLoginReq
    {
        [Required]
        [MinLength(3,ErrorMessage = "Username not long enough!")]
        public string Username { get; set; } = String.Empty;
        
        [Required]
        [MinLength(8,ErrorMessage = "Password not long enough!")]
        public string Password { get; set; } = String.Empty;
    }
    public class UserGetReq
    {
        public string? Username { get; set; } = String.Empty;
    }
    public class UserUpdateReq
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [MinLength(3,ErrorMessage = "Username not long enough!")]
        public string Username { get; set; } = String.Empty;

        [Required]
        [MinLength(8,ErrorMessage = "Password not long enough!")]
        public string Password { get; set; } = String.Empty;
        public string MoreData { get; set; } = String.Empty;
    }
    public class DeleteUserReq
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string Username { get; set; } = String.Empty;
        [Required]
        public string Password { get; set; } = String.Empty;

    }
}