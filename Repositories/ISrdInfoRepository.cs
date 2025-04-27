namespace sharpAngleTemplate.models.repositories;

using Items;
using sharpAngleTemplate.models.DTO.Updated;
public interface ISrdInfoRepository
{
  /// <summary>
  /// Get all the classes
  /// </summary>
  /// <returns> Classes</returns>
  List<Class5E> GetClasses(string version = "2014");

  /// <summary>
  /// Get all the subclasses
  /// </summary>
  /// <returns> Subclasses</returns>
  List<Subclass> GetSubclasses(string version = "2014");
  
  /// <summary>
  /// Get all the backgrounds
  /// </summary>
  /// <returns> Backgrounds</returns>
  /// <summary>
  List<Background> GetBackgrounds(string version = "2014");
  
  /// <summary>
  /// Get all the feats
  /// </summary>
  /// <returns> Feats</returns>
  List<Feat> GetFeats(string version = "2014");

  /// <summary>
  /// Get all the items
  /// </summary>
  /// <returns> Items</returns>
  List<DTO.Updated.Item> GetItems(string version = "2014");

  /// <summary>
  /// Get all the races
  /// </summary>
  /// <returns>races</returns>
  List<Race> GetRaces(string version = "2014");

  /// <summary>
  /// Get all subraces
  /// </summary>
  /// <returns>Subraces</returns>
  List<Subrace> GetSubraces(string version = "2014");

  /// <summary>
  /// Get all the spells
  /// </summary>
  /// <returns>Spells</returns>
  List<Spell> GetSpells(string version = "2014");
  
  /// <summary>
  /// Get all the magic items
  /// </summary>
  /// <returns>magic items</returns>
  List<MagicItem> GetMagicItems();

  /// <summary>
  /// Get all the weapon masteries
  /// </summary>
  /// <returns>masteries</returns>
  List<WeaponMastery> GetWeaponMasteries();

}