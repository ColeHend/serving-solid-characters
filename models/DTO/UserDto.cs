using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace sharpAngleTemplate.models.DTO
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public byte[] PassHash { get; set; }
        public byte[] PassSalt { get; set; }
        public string MoreData { get; set; }
    }
}