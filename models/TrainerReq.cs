using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using sharpAngleTemplate.models.entities;

namespace sharpAngleTemplate.models
{
    public class TrainerAddReq
    {
        public string Name { get; set; }
        public int UserId { get; set; }
        public List<Pokemon> Pokemon { get; set; }
    }

    public class TrainerUpdateReq
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int UserId { get; set; }
        public List<Pokemon> Pokemon { get; set; }
    }
}