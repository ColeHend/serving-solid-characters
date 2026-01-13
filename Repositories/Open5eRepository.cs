using sharpAngleTemplate.models.DTO.Updated;
using sharpAngleTemplate.tools;
using Newtonsoft.Json;

namespace sharpAngleTemplate.models.repositories;

public class Open5eRepository
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl = "https://api.open5e.com/";
    public Open5eRepository(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<Open5eSpell>> GetSpellsAsync()
    {
        var spells = new List<Open5eSpell>();
        var nextUrl = $"{_baseUrl}spells/";

        while (nextUrl != null)
        {
            var response = await _httpClient.GetAsync(nextUrl);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var spellResponse = JsonConvert.DeserializeObject<Open5eResponse<Open5eSpell>>(content);

            if (spellResponse != null)
            {
                spells.AddRange(spellResponse.Results);
                nextUrl = spellResponse.Next;
            }
            else
            {
                nextUrl = null;
            }
        }

        return spells;
    }

    public async Task<List<Open5eClass>> GetClassesAsync()
    {
        var classes = new List<Open5eClass>();
        var nextUrl = $"{_baseUrl}classes/";

        while (nextUrl != null)
        {
            var response = await _httpClient.GetAsync(nextUrl);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var classResponse = JsonConvert.DeserializeObject<Open5eResponse<Open5eClass>>(content);

            if (classResponse != null)
            {
                classes.AddRange(classResponse.Results);
                nextUrl = classResponse.Next;
            }
            else
            {
                nextUrl = null;
            }
        }

        return classes;
    }

}

public class Open5eResponse<T>
{
    public int Count { get; set; }
    public string Next { get; set; }
    public string Previous { get; set; }
    public List<T> Results { get; set; }
}

public class Open5eClass
{
    public string Slug { get; set; }
    public string Name { get; set; }
    public string desc { get; set; }
    public string Hit_dice { get; set; }
    public string Hp_at_1st_level { get; set; }
    public string Hp_at_higher_levels { get; set; }
    public string Prof_armor { get; set; }
    public string Prof_weapons { get; set; }
    public string Prof_tools { get; set; }
    public string Prof_saving_throws { get; set; }
    public string Prof_skills { get; set; }
    public string Equipment { get; set; }
    public string Table { get; set; }
    public string Spellcasting_ability { get; set; }
    public string Subtypes_name { get; set; }
    public Open5eSubclass[] Archetypes { get; set; }
}

public class Open5eSubclass
{
    public string Slug { get; set; }
    public string Name { get; set; }
    public string Desc { get; set; }
    public string Document__slug { get; set; }
    public string Document__title { get; set; }
    public string Document__license_url { get; set; }
    public string Document__url { get; set; }
}

public class Open5eSpell
{
    public string Slug { get; set; }
    public string Name { get; set; }
    public string Desc { get; set; }
    public string Higher_level { get; set; }
    public int Page { get; set; }
    public string Range { get; set; }
    public int Target_range_sort { get; set; }  
    public string Components { get; set; }
    public string Material { get; set; }
    public string Ritual { get; set; }
    public bool Can_be_cast_as_ritual { get; set; }
    public string Duration { get; set; }
    public string Concentration { get; set; }
    public bool Requires_concentration { get; set; }
    public string Casting_time { get; set; }
    public string Level { get; set; }  
    public int Level_int { get; set; }
    public int Spell_level { get; set; }
    public string School { get; set; }
    public string Dnd_class { get; set; }
    public string[] Spell_lists { get; set; }
    public string Archetype { get; set; }
    public string Circles { get; set; }
    public string Document__slug { get; set; }
    public string Document__title { get; set; }
    public string Document__license_url { get; set; }
    public string Document__url { get; set; }
}