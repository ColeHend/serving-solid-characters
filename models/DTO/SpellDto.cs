public class SpellDto
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string HigherLevels { get; set; }
    public string Range { get; set; }
    public string Components { get; set; }
    public string Duration { get; set; }
    public string CastingTime { get; set; }
    public bool IsRitual { get; set; }
    public bool IsConcentration { get; set; }
    public int Level { get; set; }
    public string School { get; set; }
    public string DamageType { get; set; }
    public string AttackType { get; set; }
    public string Dc { get; set; }
    public string HealAtSlotLevel { get; set; }
    public string AreaOfEffect { get; set; }
    public List<string> Classes { get; set; }
}
