import { Accessor, Component, For, Setter, Show } from "solid-js";
import { Button, FormField, Input, Select, Weapon, Option, Chip, TextArea } from "../../../../../../../shared";
import { SetStoreFunction } from "solid-js/store";

interface props {
    currentWeapon: Weapon,
    setCurrentWeapon: SetStoreFunction<Weapon>,
    styles: CSSModuleClasses,
    dmgDice: Accessor<string>,
    setDmgDice: Setter<string>,
    dmgType: Accessor<string>,
    setDmgType: Setter<string>,
    dmgBonus: Accessor<number>,
    setDmgBonus: Setter<number>,
    diceNumber: Accessor<number>,
    setDiceNumber: Setter<number>,
    damageTypes: ()=>string[],
    desc: Accessor<string>,
    setDesc: Setter<string>,
}

const WeaponCreate:Component<props> = (props) => {

  return <div>
    <h2>Weapon Category</h2>
    <FormField name="Category">

      <Select
        transparent
        value={props.currentWeapon.weaponCategory}
        onChange={(e)=>props.setCurrentWeapon("weaponCategory",e.currentTarget.value)}
        disableUnselected
      >
        <For each={["Martial","Simple"]}>
          { (weaponType) => <Option value={weaponType}>{weaponType}</Option> }
        </For>
      </Select>

      <Select
        transparent
        value={props.currentWeapon.weaponRange}
        onChange={(e)=>props.setCurrentWeapon("weaponRange",e.currentTarget.value)}
        disableUnselected
      >
        <For each={["Melee","Ranged"]}>
          { (weaponRange) => <Option value={weaponRange}>{weaponRange}</Option> }
        </For>
      </Select>

    </FormField>

    <h2>Damage</h2>
    <div style={`${props.styles.damage}`}>
      <h3>Dmg Dice</h3>
      <FormField class={`${props.styles.dmgDice}`} name="Dmg Dice">
        <Input 
          type="number"
          transparent
          min={0}
          placeholder="how many"
          value={props.diceNumber()}
          onChange={(e)=>{
            props.setDiceNumber(parseInt(e.currentTarget.value))
            props.setDmgDice(`${props.diceNumber()}${e.currentTarget.value}`)
          }}
        />
        <Select
          transparent
          onChange={(e)=>props.setDmgDice(`${props.diceNumber()}${e.currentTarget.value}`)}
        >
          <For each={["d4","d6","d8","d10","d12","d20"]}>
            { (dice)=> <Option value={dice}>{dice}</Option> }
          </For>
        </Select>
      </FormField>
      
      <h3>Dmg Type</h3>

      <Select 
        transparent
        value={props.dmgType()}
        onChange={(e)=>props.setDmgType(e.currentTarget.value)}
      >
        <For each={props.damageTypes().filter(x=>x !== "")}>
          { (damageType) => <Option value={damageType}>{damageType}</Option> }
        </For>
      </Select>

      <h3>Damage Bonus</h3>
      <FormField name="Dmg Bonus">
        <Input 
          type="number"
          transparent
          value={props.dmgBonus()}
          onInput={(e)=>props.setDmgBonus(parseInt(e.currentTarget.value))}
        />
      </FormField>

      <Button onClick={()=>props.setCurrentWeapon("damage",old=>([...old,{
        damageDice: props.dmgDice(),
        damageType: props.dmgType(),
        damageBonus: props.dmgBonus()
      }]))}>Add Damage</Button>

    </div>

    <Show when={props.currentWeapon.damage.length > 0}>
      <For each={props.currentWeapon.damage}>
        { (damageObj) => <Chip key={`${damageObj.damageDice} + ${damageObj.damageBonus}`} value={damageObj.damageType} /> }
      </For>
    </Show>

    <h2>Range</h2>

    <div style={{display:"flex","flex-direction":"row"}}>
      <div>
        <h3>Normal</h3>
        <FormField name="Normal">
          <Input 
            type="number"
            transparent
            value={props.currentWeapon.range.normal}
            onInput={(e)=>props.setCurrentWeapon("range",old=>({
              normal: parseInt(e.currentTarget.value),
              long: old.long
            }))}
          />
        </FormField>
      </div>
      <div>
        <h3>Long</h3>
        <FormField name="Long" >
          <Input 
            type="number"
            transparent
            value={props.currentWeapon.range.long}
            onInput={(e)=>props.setCurrentWeapon("range",old=>({
              normal: old.normal,
              long: parseInt(e.currentTarget.value)
            }))}
          />
        </FormField>
      </div>
    </div>

    <h2>Description</h2>
    <FormField name="Desc">
      <TextArea
        text={props.desc}
        setText={props.setDesc}
        transparent
      />
    </FormField>

    <h2>Weight</h2>
    <FormField name="Weight">
      <Input 
        type="number"
        transparent
        value={props.currentWeapon.weight}
        onInput={(e)=>props.setCurrentWeapon("weight",parseInt(e.currentTarget.value))}
      />
    </FormField>

  </div>
}

export default WeaponCreate