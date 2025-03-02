/**
 * @param bonus - Attack Bonus
 * @param ac - Target ac to hit
 * @param advantage - True for advantage, False for disadvantage, null for a normal attack
 * 
 * @returns {number} The chance to hit as a number
 */
export function ChanceToHit(bonus: number,ac: number, advantage: boolean | null): number {
  switch (advantage) {
  case true : // advantage
    const advant = 1 - ((ac - bonus) / 20);
    return advant * advant;
  case false: // disadvantage
    const disadvantage = ((20 - ac + bonus) / 20);
    return disadvantage * disadvantage;
  default: // normal attacks
    return (1 - (ac - bonus - 1) / 20);
  }
};


/**
 *  @param options 
 * 
 *  @returns {number} The average damage delt as a number;
 */
export function TotalDamage(options: dmgCalcOptions): number {
  const critAble = (options.dieNumber * options.dieDamage);
  if (options.adv) {
    return ((critAble + options.modifier + options.additional * ChanceToHit(options.atkBonus, options.ac, true)) + ((critAble * 2) * (0.05 * options.critModifier))) // advantage
  } else if (options.adv === null) {
    return ((critAble + options.modifier + options.additional * ChanceToHit(options.atkBonus, options.ac, null)) + ((critAble * 2) * (0.05 * options.critModifier))) // normal attacks
  } else {
    return ((critAble + options.modifier + options.additional * ChanceToHit(options.atkBonus, options.ac, false)) + ((critAble * 2) * (0.05 * options.critModifier))) // disadvantage
  }
};


/**
 *  @param atkBonus - Attack Bonus
 *  @param ac - Target ac to hit
 *  @param adv - True for advantage, False for disadvantage, null for a normal attack
 *  @param dieNumber - number of damage die rolled
 *  @param dieDamage - d4: 2.5, d6: 3.5, d8: 4.5, d10: 5.5, d12: 6.5
 *  @param modifier - Any stat modifiers added;
 *  @param additional - Any additional bonuses from other sources
 *  @param critModifier - number of die that can cause a crit. Default is 1
 *  
 */
interface dmgCalcOptions {
    atkBonus: number;
    ac: number;
    adv?: boolean;
    dieNumber: number;
    dieDamage: number;
    modifier: number;
    additional: number;
    critModifier: number;
}