namespace SolidCharacters.Repository;
using SolidCharacters.Domain.DTO.Updated;
using SolidCharacters.Repository.Extensions;
using SolidCharacters.Domain.Open5e;
public sealed class Closed5eRepository
{
    private readonly Open5eRepository _open5eRepository;
    public Closed5eRepository(Open5eRepository open5eRepository)
    {
        _open5eRepository = open5eRepository;
    }

    public async Task<List<Spell>> GetOpen5eSpells()
    {
        var spells = await _open5eRepository.GetV2SpellsAsync();
        return spells.Select(s => s.ToDomainModel()).ToList();
    }

    public async Task<List<Background>> GetOpen5eBackgrounds()
    {
        var backgrounds = await _open5eRepository.GetV2BackgroundsAsync();
        return backgrounds.Select(b => b.ToDomainModel()).ToList();
    }

    public async Task<List<Feat>> GetOpen5eFeats()
    {
        var feats = await _open5eRepository.GetV2FeatsAsync();
        return feats.Select(f => f.ToDomainModel()).ToList();
    }

    public async Task<List<Class5E>> GetOpen5eClasses()
    {
        List<Open5eV1Class> documents = await _open5eRepository.GetV1ClassesAsync() ?? new();
        return documents.Select(d => d.ToDomainModel()).ToList();
    }

    public async Task<List<Item>> GetOpen5eItems()
    {
        List<Open5eV2Weapon> weapons = await _open5eRepository.GetV2WeaponsAsync() ?? new();
        List<Open5eV2Armor> armor = await _open5eRepository.GetV2ArmorAsync() ?? new();
        var items = weapons
            .Select(x => x.ToDomainModel())
            .Concat(armor.Select(x => x.ToDomainModel()))
            .ToList();
        return items;
    }
    
    // public async Task<List<Item>> GetOpen5eItems()
    // {
    //     var weapons = await _open5eRepository.GetV2WeaponsAsync();
    //     var armor = await _open5eRepository.GetV2ArmorAsync();
    //     return items;
    // }
}