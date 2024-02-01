using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace sharpAngleTemplate.models.entities
{
    public class Trainer
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }

        public int UserId { get; set; }

        public List<Pokemon> Pokemon { get; set; }


    }
}