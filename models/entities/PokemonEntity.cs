using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace sharpAngleTemplate.models.entities
{
    public class Pokemon
    {
        [Key]
        public int Id { get; set; }
        public string PokeName { get; set; }

    }
}