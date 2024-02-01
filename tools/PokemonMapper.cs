using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using sharpAngleTemplate.models.DTO;
using sharpAngleTemplate.models.entities;

namespace sharpAngleTemplate.tools
{
    public class PokemonMapper: IPokemonMapper
    {
        public PokemonDto MapPokemon(Pokemon pokemon)
        {
            return new PokemonDto() {
                Id = pokemon.Id,
                PokeName=pokemon.PokeName
            };
        }
        public Pokemon MapPokemon(PokemonDto pokemon)
        {
            return new Pokemon() {
                Id = pokemon.Id,
                PokeName=pokemon.PokeName
            };
        }
        public List<PokemonDto> MapMultiPokemon(List<Pokemon> pokemon)
        {
            var team = new List<PokemonDto>(); 
            foreach (var poke in pokemon)
            {
                team.Add(MapPokemon(poke));
            }

            return team;
        }
        public List<Pokemon> MapMultiPokemon(List<PokemonDto> pokemon)
        {
            var team = new List<Pokemon>(); 
            foreach (var poke in pokemon)
            {
                team.Add(MapPokemon(poke));
            }

            return team;
        }
        public TrainerDto MapTrainer(Trainer trainer)
        {
            return new TrainerDto(){
                Id=trainer.Id,
                Name=trainer.Name,
                Pokemon=trainer.Pokemon,
                UserId=trainer.UserId
            };
        }
        public Trainer MapTrainer(TrainerDto trainer)
        {
            return new Trainer(){
                Id=trainer.Id,
                Name=trainer.Name,
                Pokemon=trainer.Pokemon,
                UserId=trainer.UserId
            };
        }
        public List<TrainerDto> MapMultiTrainer(List<Trainer> trainers)
        {
            var trainersDto = new List<TrainerDto>(); 

            foreach (var trainer in trainers)
            {
                trainersDto.Add(MapTrainer(trainer));
            }
            
            return trainersDto;
        }
        public List<Trainer> MapMultiTrainer(List<TrainerDto> trainers)
        {
            var trainersDto = new List<Trainer>(); 

            foreach (var trainer in trainers)
            {
                trainersDto.Add(MapTrainer(trainer));
            }
            
            return trainersDto;
        }
        
    
    }
        public interface IPokemonMapper
        {
            public PokemonDto MapPokemon(Pokemon pokemon);
            public Pokemon MapPokemon(PokemonDto pokemon);
            public List<PokemonDto> MapMultiPokemon(List<Pokemon> trainer);
            public List<Pokemon> MapMultiPokemon(List<PokemonDto> trainer);

            public TrainerDto MapTrainer(Trainer pokemon);
            public Trainer MapTrainer(TrainerDto pokemon);
            public List<TrainerDto> MapMultiTrainer(List<Trainer> trainers);
            public List<Trainer> MapMultiTrainer(List<TrainerDto> trainers);
            
        }
    }
