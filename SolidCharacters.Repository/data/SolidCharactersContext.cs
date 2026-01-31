using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SolidCharacters.Domain.Entities;

namespace SolidCharacters.Repository.Data
{
    public class SolidCharactersContext: DbContext
    {
        public SolidCharactersContext(DbContextOptions<SolidCharactersContext> dbContextOptions): base(dbContextOptions)
        {}
        
        public DbSet<User> Users => Set<User>();
        public DbSet<SpellEntity> Pokemon => Set<SpellEntity>();

        // public DbSet<ClassEntity> Classes => Set<ClassEntity>();

    }
}