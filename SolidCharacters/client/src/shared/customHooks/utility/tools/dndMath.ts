/**
 * D&D 5e Math Utilities for DPR Calculation
*/
export function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
}

/**
 * Calculate the ability modifier for a given ability score.
 */
export function getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * D&D 5e DPR (Damage Per Round) Calculator
 *
 * Based on LudicSavant's DPR Calculator v2.0 documentation.
 * Implements hit/save probability, damage averaging, and full DPR computation
 * including advantage/disadvantage, Elven Accuracy, Halfling Luck,
 * bonus/penalty dice, critical hits, Great Weapon Fighting, Elemental Adept,
 * once-per-turn effects, power attacks, and save-based damage.
 */

// ─── Damage Calculation Types ───────────────────────────────────────────────────────────────────

/** Represents a group of identical dice, e.g. 2d6 */
export interface DiceGroup {
  count: number;
  sides: number; // 4, 6, 8, 10, or 12
}

/** Options that modify how damage dice are rolled */
export interface DiceModifiers {
  /** Great Weapon Fighting: reroll 1s and 2s */
  greatWeaponFighting?: boolean;
  /** Elemental Adept: treat 1s as 2s */
  elementalAdept?: boolean;
}

/** Describes one attack's hit parameters */
export interface AttackParams {
  attackBonus: number;
  targetAC: number;
  advantageMode: "normal" | "advantage" | "disadvantage";
  elvenAccuracy?: boolean;
  halflingLuck?: boolean;
  critThreshold?: number; // default 20; Champion fighters get 19 or 18
}

/** Describes the damage dealt by one attack */
export interface AttackDamage {
  /** Dice rolled on a normal hit */
  damageDice: DiceGroup[];
  /** Static bonus added to damage (e.g. ability modifier) */
  damageBonus: number;
  /** Additional dice rolled only on a critical hit (e.g. Brutal Critical) */
  critBonusDice?: DiceGroup[];
  /** Modifiers affecting how dice are rolled */
  diceModifiers?: DiceModifiers;
}

/** A full attack action entry for DPR computation */
export interface AttackEntry {
  attack: AttackParams;
  damage: AttackDamage;
  numberOfAttacks: number;
}

/** Bonus dice added/subtracted from the d20 roll (e.g. Bless = 1d4, Bane = -1d4) */
export interface BonusDie {
  sides: number; // e.g. 4 for Bless
  penalty?: boolean; // true if this is subtracted (Bane, Cutting Words, etc.)
}

/** Once-per-turn damage like Sneak Attack or Divine Strike */
export interface OncePerTurnDamage {
  damageDice: DiceGroup[];
  damageBonus: number;
  diceModifiers?: DiceModifiers;
}

/** Parameters for a save-based damage effect */
export interface SaveEffectParams {
  saveDC: number;
  targetSaveBonus: number;
  /** Damage dice on a failed save */
  damageDice: DiceGroup[];
  damageBonus: number;
  diceModifiers?: DiceModifiers;
  saveType: "no_save" | "save_negates" | "save_half";
  evasion?: boolean;
  numberOfTargets?: number;
}

/** Complete result of a DPR calculation */
export interface DPRResult {
  /** Total expected damage per round */
  dpr: number;
  /** Probability of hitting at least once */
  hitChance: number;
  /** Probability of a critical hit per attack */
  critChance: number;
  /** Average damage on a normal hit (per attack) */
  averageDamageOnHit: number;
  /** Average damage on a critical hit (per attack) */
  averageDamageOnCrit: number;
}

// ─── Core Probability Functions ──────────────────────────────────────────────

/**
 * Basic probability of hitting a given AC with a given attack bonus.
 * P(hit) = (21 - AC + attackBonus) / 20, clamped to [0.05, 0.95].
 * A natural 20 always hits (min 0.05), a natural 1 always misses (max 0.95).
 */
export function baseHitProbability(
  attackBonus: number,
  targetAC: number
): number {
  const raw = (21 - targetAC + attackBonus) / 20;
  return Math.min(0.95, Math.max(0.05, raw));
}

/**
 * Basic probability of a target failing a saving throw.
 * P(fail) = 1 - P(save), where P(save) = (21 - DC + saveBonus) / 20, clamped to [0, 1].
 * No critical effects on saves, so thresholds are 0 and 1.
 */
export function baseSaveFailProbability(
  saveDC: number,
  targetSaveBonus: number
): number {
  const pSave = (21 - saveDC + targetSaveBonus) / 20;
  return 1 - Math.min(1, Math.max(0, pSave));
}

/**
 * Apply advantage, disadvantage, or Elven Accuracy to a base probability.
 *
 * - Advantage:       P_adv = 1 - (1 - P)^2
 * - Disadvantage:    P_dis = P^2
 * - Elven Accuracy:  P_ea  = 1 - (1 - P)^3  (super-advantage with 3 dice)
 */
export function applyAdvantageMode(
  p: number,
  mode: "normal" | "advantage" | "disadvantage",
  elvenAccuracy: boolean = false
): number {
  switch (mode) {
    case "advantage":
      if (elvenAccuracy) {
        // Elven Accuracy: roll 3 dice, take highest
        return 1 - Math.pow(1 - p, 3);
      }
      return 1 - Math.pow(1 - p, 2);
    case "disadvantage":
      return Math.pow(p, 2);
    default:
      return p;
  }
}

/**
 * Apply Halfling Luck to a probability.
 *
 * Halfling Lucky: reroll one d20 if it shows a 1.
 * For attacks, a nat 1 is always a miss, so the reroll condition is
 * always within the failure range.
 *
 * Normal:       P_luck = P + (1/20)(1 - 1/20) * P_base_no_luck_adjustment
 * Simplified:   P_luck = P + (1/20) * P   (since rolling a 1 then succeeding on reroll)
 *
 * More precisely, for attacks:
 *   P_luck_normal = P + (1/20) * P
 *   P_luck_adv    = P_adv + 2*(1/20)*(1-1/20) * (1-P) * P  [approximation]
 *   P_luck_dis    = P_dis + (1/20) * P * (2*P - P^2) ... complex
 *
 * We use the simplified approach: the probability of rolling a 1 on
 * any relevant d20, times the probability of succeeding on the reroll.
 */
export function applyHalflingLuck(
  baseP: number,
  mode: "normal" | "advantage" | "disadvantage",
  elvenAccuracy: boolean = false
): number {
  const pRerollSuccess = baseP; // probability of succeeding on the reroll
  const pRollOne = 1 / 20;

  switch (mode) {
    case "normal":
      // P + (1/20) * P = P * (1 + 1/20) ... but that's not quite right.
      // Correct: P_luck = P + pRollOne * (1 - P_without_luck_for_that_roll) * ... 
      // Simplified per the doc: succeed normally OR (roll a 1 AND succeed on reroll)
      // For normal: P_luck = P + (1/20) * baseHitP
      // But the "P" already includes the nat-1-is-a-miss floor.
      // The bonus is: probability of rolling exactly a 1 (which is always a miss)
      // times probability the reroll hits.
      return baseP + pRollOne * pRerollSuccess;

    case "advantage": {
      if (elvenAccuracy) {
        // 3 dice: probability that at least one d20 is a 1 and all would otherwise miss,
        // times reroll success. This gets complex; approximate:
        const pFail = 1 - baseP;
        const pAllFail = Math.pow(pFail, 3);
        const pAllFailNoOnes = Math.pow(pFail - pRollOne, 3);
        // Probability at least one 1 among failures:
        const pAtLeastOneOneAmongFailures = pAllFail - pAllFailNoOnes;
        return 1 - pAllFail + pAtLeastOneOneAmongFailures * pRerollSuccess;
      }
      // 2 dice advantage with halfling luck
      const pFail = 1 - baseP;
      const pAllFail = Math.pow(pFail, 2);
      const pAllFailNoOnes = Math.pow(pFail - pRollOne, 2);
      const pAtLeastOneOne = pAllFail - pAllFailNoOnes;
      return 1 - pAllFail + pAtLeastOneOne * pRerollSuccess;
    }

    case "disadvantage": {
      // Both dice must succeed. Halfling luck lets you reroll one 1.
      // P_dis_luck = P^2 + (for each die: P(that die is 1) * P(other die succeeds) * P(reroll succeeds))
      // Simplified: you need both to succeed; if one is a 1, reroll it
      const pBothSucceed = baseP * baseP;
      // P(exactly one die is 1, other succeeds) * P(reroll succeeds)
      // P(die is 1) = 1/20, P(other succeeds) = baseP
      // Two ways this can happen (die1=1 or die2=1), but halfling luck only rerolls one
      const bonus = 2 * pRollOne * baseP * pRerollSuccess -
        pRollOne * pRollOne * baseP * pRerollSuccess; // subtract double-count
      return pBothSucceed + bonus;
    }
  }
}

/**
 * Compute the full hit probability for an attack, incorporating
 * advantage/disadvantage, Elven Accuracy, and Halfling Luck.
 */
export function hitProbability(params: AttackParams): number {
  const baseP = baseHitProbability(params.attackBonus, params.targetAC);

  if (params.halflingLuck) {
    return applyHalflingLuck(
      baseP,
      params.advantageMode,
      params.elvenAccuracy ?? false
    );
  }

  return applyAdvantageMode(
    baseP,
    params.advantageMode,
    params.elvenAccuracy ?? false
  );
}

/**
 * Compute the probability of scoring a critical hit.
 *
 * The crit probability is the probability of rolling >= critThreshold on
 * the d20 itself (no attack bonus). This is equivalent to
 * P(hit AC = critThreshold, attackBonus = 0), but with thresholds [0, 1]
 * instead of [0.05, 0.95] since we don't apply the nat-1/nat-20 override here—
 * the critical range IS the nat-20 override.
 */
export function critProbability(params: AttackParams): number {
  const threshold = params.critThreshold ?? 20;
  // Number of faces that crit: 20 - threshold + 1
  const baseP = (21 - threshold) / 20;

  if (params.halflingLuck) {
    return applyHalflingLuck(
      baseP,
      params.advantageMode,
      params.elvenAccuracy ?? false
    );
  }

  return applyAdvantageMode(
    baseP,
    params.advantageMode,
    params.elvenAccuracy ?? false
  );
}

// ─── Bonus/Penalty Dice (Bless, Bane, etc.) ─────────────────────────────────

/**
 * Compute a probability distribution for a set of bonus/penalty dice.
 * Returns a Map from total modifier value to its probability.
 *
 * For example, Bless (1d4) produces: {1: 0.25, 2: 0.25, 3: 0.25, 4: 0.25}
 * Bane (-1d4) produces: {-1: 0.25, -2: 0.25, -3: 0.25, -4: 0.25}
 */
export function bonusDiceDistribution(
  dice: BonusDie[]
): Map<number, number> {
  let dist = new Map<number, number>();
  dist.set(0, 1);

  for (const die of dice) {
    const newDist = new Map<number, number>();
    const sign = die.penalty ? -1 : 1;
    const pPerFace = 1 / die.sides;

    for (const [existingVal, existingProb] of dist) {
      for (let face = 1; face <= die.sides; face++) {
        const newVal = existingVal + sign * face;
        const newProb = (newDist.get(newVal) ?? 0) + existingProb * pPerFace;
        newDist.set(newVal, newProb);
      }
    }

    dist = newDist;
  }

  return dist;
}

/**
 * Compute hit probability incorporating bonus/penalty dice (like Bless/Bane).
 *
 * P(hit with bonus dice) = Σ P(bonus = b) * H(AC, attack + b)
 *
 * where H computes the full hit probability (with advantage, etc.)
 */
export function hitProbabilityWithBonusDice(
  params: AttackParams,
  bonusDice: BonusDie[]
): number {
  if (bonusDice.length === 0) return hitProbability(params);

  const dist = bonusDiceDistribution(bonusDice);
  let totalP = 0;

  for (const [bonus, prob] of dist) {
    const modifiedParams: AttackParams = {
      ...params,
      attackBonus: params.attackBonus + bonus,
    };
    totalP += prob * hitProbability(modifiedParams);
  }

  return totalP;
}

// ─── Damage Computation ──────────────────────────────────────────────────────

/**
 * Average value of a single dN: (N + 1) / 2
 */
export function averageDie(sides: number): number {
  return (sides + 1) / 2;
}

/**
 * Average value of a single die with Great Weapon Fighting (reroll 1s and 2s).
 *
 * For a dN: (avg(dN) + avg(dN) + 3 + 4 + ... + N) / N
 * i.e., faces 1 and 2 each produce the average of a fresh dN roll.
 */
export function averageDieGWF(sides: number): number {
  const normalAvg = averageDie(sides);
  let sum = 2 * normalAvg; // faces 1 and 2 each reroll to normal average
  for (let face = 3; face <= sides; face++) {
    sum += face;
  }
  return sum / sides;
}

/**
 * Average value of a single die with Elemental Adept (treat 1s as 2s).
 *
 * For a dN: (2 + 2 + 3 + 4 + ... + N) / N
 */
export function averageDieElementalAdept(sides: number): number {
  let sum = 2; // face 1 becomes 2
  for (let face = 2; face <= sides; face++) {
    sum += face;
  }
  return sum / sides;
}

/**
 * Average value of a single die with both GWF and Elemental Adept.
 *
 * Face 1: reroll with Elemental Adept → averageDieElementalAdept(N)
 * Face 2: reroll with Elemental Adept → averageDieElementalAdept(N)
 * Faces 3+: face value
 */
export function averageDieGWFAndEA(sides: number): number {
  const eaAvg = averageDieElementalAdept(sides);
  let sum = 2 * eaAvg; // faces 1 and 2 reroll to EA average
  for (let face = 3; face <= sides; face++) {
    sum += face;
  }
  return sum / sides;
}

/**
 * Compute the average damage for a set of dice groups with modifiers.
 */
export function averageDamageFromDice(
  diceGroups: DiceGroup[],
  modifiers?: DiceModifiers
): number {
  let total = 0;
  const gwf = modifiers?.greatWeaponFighting ?? false;
  const ea = modifiers?.elementalAdept ?? false;

  for (const group of diceGroups) {
    let avg: number;
    if (gwf && ea) {
      avg = averageDieGWFAndEA(group.sides);
    } else if (gwf) {
      avg = averageDieGWF(group.sides);
    } else if (ea) {
      avg = averageDieElementalAdept(group.sides);
    } else {
      avg = averageDie(group.sides);
    }
    total += group.count * avg;
  }

  return total;
}

/**
 * Compute average damage on a normal hit.
 */
export function damageOnHit(damage: AttackDamage): number {
  return (
    averageDamageFromDice(damage.damageDice, damage.diceModifiers) +
    damage.damageBonus
  );
}

/**
 * Compute average damage on a critical hit.
 * Critical hits double all damage dice (but not static bonuses).
 * Additional crit-only dice (like Brutal Critical) are also added.
 */
export function damageOnCrit(damage: AttackDamage): number {
  // Double the normal dice
  const doubledDice: DiceGroup[] = damage.damageDice.map((g) => ({
    count: g.count * 2,
    sides: g.sides,
  }));

  let total = averageDamageFromDice(doubledDice, damage.diceModifiers);

  // Add crit-only bonus dice (these are NOT doubled — they're already the extra dice)
  if (damage.critBonusDice) {
    total += averageDamageFromDice(damage.critBonusDice, damage.diceModifiers);
  }

  return total + damage.damageBonus;
}

// ─── DPR: Attack Rolls ───────────────────────────────────────────────────────

/**
 * Compute basic DPR for a single attack.
 *
 * E(damage) = (P - C) × DPH + C × DPC
 *
 * where P = probability of hitting, C = probability of critting,
 * DPH = damage on hit, DPC = damage on crit.
 *
 * Note: (P - C) is the probability of a regular (non-crit) hit.
 */
export function singleAttackDPR(
  attack: AttackParams,
  damage: AttackDamage
): number {
  const P = hitProbability(attack);
  const C = critProbability(attack);
  const DPH = damageOnHit(damage);
  const DPC = damageOnCrit(damage);

  return (P - C) * DPH + C * DPC;
}

/**
 * Compute full DPR result for a single attack.
 */
export function singleAttackDPRResult(
  attack: AttackParams,
  damage: AttackDamage
): DPRResult {
  const P = hitProbability(attack);
  const C = critProbability(attack);
  const DPH = damageOnHit(damage);
  const DPC = damageOnCrit(damage);

  return {
    dpr: (P - C) * DPH + C * DPC,
    hitChance: P,
    critChance: C,
    averageDamageOnHit: DPH,
    averageDamageOnCrit: DPC,
  };
}

/**
 * Compute DPR for multiple attacks in a round (just sums them up).
 * For N identical attacks, multiply by N.
 */
export function multiAttackDPR(entries: AttackEntry[]): number {
  let total = 0;
  for (const entry of entries) {
    total += singleAttackDPR(entry.attack, entry.damage) * entry.numberOfAttacks;
  }
  return total;
}

// ─── Once-Per-Turn Effects (Sneak Attack, Divine Strike, etc.) ────────────────

/**
 * Compute the probability of landing at least one hit in a set of attacks.
 *
 * P(at least one hit) = 1 - Π(1 - P_i) for each attack i.
 */
export function probabilityOfAtLeastOneHit(entries: AttackEntry[]): number {
  let pAllMiss = 1;
  for (const entry of entries) {
    const P = hitProbability(entry.attack);
    pAllMiss *= Math.pow(1 - P, entry.numberOfAttacks);
  }
  return 1 - pAllMiss;
}

/**
 * Compute the probability of at least one critical among all attacks.
 *
 * P(at least one crit) = 1 - Π(1 - C_i) for each attack i.
 */
export function probabilityOfAtLeastOneCrit(entries: AttackEntry[]): number {
  let pNoCrit = 1;
  for (const entry of entries) {
    const C = critProbability(entry.attack);
    pNoCrit *= Math.pow(1 - C, entry.numberOfAttacks);
  }
  return 1 - pNoCrit;
}

/**
 * Compute the additional DPR from a once-per-turn effect (like Sneak Attack).
 *
 * Assumes the effect triggers on the first hit landed. The calculation
 * splits into regular hits and crit hits:
 *
 * Additional DPR =
 *   P(at least one hit) × DS          (base once-per-turn damage)
 * + P(first hit is a crit) × DSC      (extra crit dice for the effect)
 *
 * where DS is the average once-per-turn damage and DSC is the average
 * of the once-per-turn damage dice only (extra rolled on crit, no static bonus).
 *
 * For simplicity, P(first hit is crit | at least one hit) ≈ C/P for the
 * first attack group weighted by hit probability.
 */
export function oncePerTurnDPR(
  entries: AttackEntry[],
  oncePerTurn: OncePerTurnDamage
): number {
  const pAtLeastOneHit = probabilityOfAtLeastOneHit(entries);
  if (pAtLeastOneHit === 0) return 0;

  const DS =
    averageDamageFromDice(oncePerTurn.damageDice, oncePerTurn.diceModifiers) +
    oncePerTurn.damageBonus;

  // DSC: just the dice portion (doubled for crit, minus the normal dice = extra dice avg)
  const DSC = averageDamageFromDice(
    oncePerTurn.damageDice,
    oncePerTurn.diceModifiers
  );

  // Compute P(first hit is a crit) using the doc's approach:
  // For each attack group, compute contribution to "first hit is crit"
  // P(first hit is crit) = Σ_groups [ P(no hits before this group) × P(≥1 hit in group) × (C/P) ]
  let pFirstHitIsCrit = 0;
  let pNoHitsSoFar = 1;

  for (const entry of entries) {
    const P = hitProbability(entry.attack);
    const C = critProbability(entry.attack);
    if (P === 0) continue;

    const pAllMissInGroup = Math.pow(1 - P, entry.numberOfAttacks);
    const pAtLeastOneHitInGroup = 1 - pAllMissInGroup;

    // Given at least one hit in this group, probability that first hit is a crit
    // approximated as C/P (proportion of hits that are crits)
    pFirstHitIsCrit += pNoHitsSoFar * pAtLeastOneHitInGroup * (C / P);

    pNoHitsSoFar *= pAllMissInGroup;
  }

  // Once-per-turn damage:
  // = P(at least one hit) × DS + P(first hit is crit) × DSC
  return pAtLeastOneHit * DS + pFirstHitIsCrit * DSC;
}

// ─── Power Attacks (Sharpshooter / Great Weapon Master) ──────────────────────

/**
 * Apply the -5/+10 power attack option (Sharpshooter or GWM).
 * Subtracts 5 from attack bonus, adds 10 to damage bonus.
 */
export function applyPowerAttack(
  attack: AttackParams,
  damage: AttackDamage
): { attack: AttackParams; damage: AttackDamage } {
  return {
    attack: {
      ...attack,
      attackBonus: attack.attackBonus - 5,
    },
    damage: {
      ...damage,
      damageBonus: damage.damageBonus + 10,
    },
  };
}

// ─── GWM Crit Bonus Action ───────────────────────────────────────────────────

/**
 * Compute additional DPR from GWM's crit bonus action attack.
 *
 * If you crit on any regular attack, you can make a bonus action attack.
 * This replaces your normal bonus action, so the net gain is:
 *   P(at least one crit) × (damage from GWM bonus attack - damage from normal bonus action)
 *
 * @param mainAttacks - The main (non-bonus-action) attacks
 * @param gwmBonusAttack - The single bonus attack granted by GWM crit
 * @param normalBonusActionDPR - DPR from whatever the normal bonus action would be (0 if none)
 */
export function gwmCritBonusDPR(
  mainAttacks: AttackEntry[],
  gwmBonusAttack: { attack: AttackParams; damage: AttackDamage },
  normalBonusActionDPR: number = 0
): number {
  const pAtLeastOneCrit = probabilityOfAtLeastOneCrit(mainAttacks);
  const gwmBonusDPR = singleAttackDPR(
    gwmBonusAttack.attack,
    gwmBonusAttack.damage
  );

  // Only beneficial if GWM bonus exceeds normal bonus action
  const netGain = gwmBonusDPR - normalBonusActionDPR;
  if (netGain <= 0) return 0;

  return pAtLeastOneCrit * netGain;
}

// ─── DPR: Save Effects ───────────────────────────────────────────────────────

/**
 * Compute the half-damage value for save effects, accounting for D&D's
 * round-down rule.
 *
 * In most cases: halfDamage = DPH / 2 - 0.25
 * This is because odd damage results (which lose 0.5 when halved and floored)
 * occur exactly half the time, so on average you lose 0.25.
 */
export function halfDamage(fullDamage: number): number {
  return fullDamage / 2 - 0.25;
}

/**
 * Compute DPR for a save-based effect.
 *
 * E(damage) = F × DOF + (1 - F) × DOS
 *
 * where F = probability target fails save, DOF = damage on fail, DOS = damage on save.
 */
export function saveEffectDPR(params: SaveEffectParams): number {
  const F = baseSaveFailProbability(params.saveDC, params.targetSaveBonus);
  const fullDmg =
    averageDamageFromDice(params.damageDice, params.diceModifiers) +
    params.damageBonus;
  const halfDmg = halfDamage(fullDmg);
  const targets = params.numberOfTargets ?? 1;

  let DOF: number; // damage on failed save
  let DOS: number; // damage on successful save

  switch (params.saveType) {
    case "no_save":
      DOF = fullDmg;
      DOS = fullDmg;
      break;
    case "save_negates":
      DOF = fullDmg;
      DOS = 0;
      break;
    case "save_half":
      if (params.evasion) {
        // Evasion: no damage on save, half damage on fail
        DOF = halfDmg;
        DOS = 0;
      } else {
        // Normal: half damage on save, full damage on fail
        DOF = fullDmg;
        DOS = halfDmg;
      }
      break;
  }

  return (F * DOF + (1 - F) * DOS) * targets;
}

// ─── Utility: Min/Max Damage ─────────────────────────────────────────────────

/**
 * Compute minimum possible damage from a set of dice + bonus.
 * Min of each die is 1 (or 2 with Elemental Adept).
 */
export function minDamage(
  diceGroups: DiceGroup[],
  bonus: number,
  elementalAdept: boolean = false
): number {
  let total = bonus;
  const minPerDie = elementalAdept ? 2 : 1;
  for (const group of diceGroups) {
    total += group.count * minPerDie;
  }
  return total;
}

/**
 * Compute maximum possible damage from a set of dice + bonus.
 */
export function maxDamage(diceGroups: DiceGroup[], bonus: number): number {
  let total = bonus;
  for (const group of diceGroups) {
    total += group.count * group.sides;
  }
  return total;
}

// ─── Full Round DPR Calculator ───────────────────────────────────────────────

export interface FullRoundParams {
  /** Main action attacks */
  attacks: AttackEntry[];
  /** Optional bonus action attacks (separate from main attacks) */
  bonusActionAttacks?: AttackEntry[];
  /** Once-per-turn damage (e.g. Sneak Attack) applied across all attacks */
  oncePerTurn?: OncePerTurnDamage;
  /** Save-based effects (e.g. a spell's save component) */
  saveEffects?: SaveEffectParams[];
}

/**
 * Compute total DPR for a full round, combining:
 * - Multiple attack action attacks
 * - Bonus action attacks
 * - Once-per-turn effects
 * - Save-based damage effects
 */
export function fullRoundDPR(params: FullRoundParams): number {
  let total = 0;

  // Attack action DPR
  total += multiAttackDPR(params.attacks);

  // Bonus action attacks DPR
  if (params.bonusActionAttacks) {
    total += multiAttackDPR(params.bonusActionAttacks);
  }

  // Once-per-turn effects
  if (params.oncePerTurn) {
    const allAttacks = [
      ...params.attacks,
      ...(params.bonusActionAttacks ?? []),
    ];
    total += oncePerTurnDPR(allAttacks, params.oncePerTurn);
  }

  // Save effects
  if (params.saveEffects) {
    for (const effect of params.saveEffects) {
      total += saveEffectDPR(effect);
    }
  }

  return total;
}