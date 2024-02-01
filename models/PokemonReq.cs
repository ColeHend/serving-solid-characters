using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace sharpAngleTemplate.models
{
    public class PokemonAddReq
    {
        public string pokeName {get;set;}
    }
    public class PokemonUpdateReq
    {
        public int id {get; set;}
        public string pokeName {get; set;}
    }
}