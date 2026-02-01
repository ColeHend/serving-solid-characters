namespace SolidCharacters.Repository.Extensions;
using SolidCharacters.Domain.DTO.Updated;
using SolidCharacters.Domain.Open5e;
public static class Open5eExtenstions
{

    public static Spell ToDomainModel(this Open5eV2Spell spell)
    {
        return new Spell
        {
        };
    }

    public static Background ToDomainModel(this Open5eV2Background background)
    {
        return new Background
        {
        };
    }

    public static Feat ToDomainModel(this Open5eV2Feat feat)
    {
        return new Feat
        {
        };
    }

    public static Class5E ToDomainModel(this Open5eV1Class class5E)
    {
        return new Class5E
        {
        };
    }

    public static Subclass ToDomainModel(this Open5eV1Subclass subclass)
    {
        return new Subclass
        {
        };
    }

    public static Race ToDomainModel(this Open5eV1Race race)
    {
        return new Race
        {
        };
    }

    public static MagicItem ToDomainModel(this Open5eV1MagicItem magicItem)
    {
        return new MagicItem
        {
        };
    }


}