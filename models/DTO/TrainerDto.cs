using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using sharpAngleTemplate.models.entities;

namespace sharpAngleTemplate.models.DTO
{
    public class TrainerDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int UserId { get; set; }
        public List<Pokemon> Pokemon { get; set; }
    }
}