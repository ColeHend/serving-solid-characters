namespace Items
{
    public class Cost
    {
        public int Quantity { get; set; }
        public string Unit { get; set; }
    }

    public class Damage
    {
        public string DamageDice { get; set; }
        public int DamageBonus { get; set; }
        public string DamageType { get; set; }
    }
    public class Range 
    {
        public int Normal { get; set; }
        public int? Long { get; set; }
    }

    public class ArmorClass
    {
        public int Base { get; set; }
        public bool DexBonus { get; set; }
        public int? MaxBonus { get; set; }
    }

    public class Item
    {
        public string Name { get; set; }
        public string EquipmentCategory { get; set; }
        public Cost Cost { get; set; }
        public int? Weight { get; set; }
        public List<string> Tags { get; set; }
        public List<string>? Desc { get; set; } 
    }

    public class Weapon : Item
    {
        public string WeaponCategory { get; set; } = string.Empty;
        public string WeaponRange { get; set; } = string.Empty;
        public string CategoryRange { get; set; } = string.Empty;
        public List<Damage> Damage { get; set; }
        public Range Range { get; set; }     
    }

    public class Armor : Item
    {
        public string ArmorCategory { get; set; }
        public bool StealthDisadvantage { get; set; }
        public int StrMin { get; set; }
        public ArmorClass ArmorClass { get; set; }
    }
}