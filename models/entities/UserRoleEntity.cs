using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace sharpAngleTemplate.models.entities
{
    public class RoleEntity
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set;}
        public string Role {get; set;} = string.Empty;
    }
}