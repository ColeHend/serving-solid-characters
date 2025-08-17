import { Accessor, Component, For, Setter, Show } from "solid-js";
import { Armor } from "../../../../../../../shared";
import { FormField, Input, Select,Option, TextArea } from "coles-solid-library";
import { SetStoreFunction } from "solid-js/store";

interface props {
    currentArmor: Armor,
    setCurrentArmor: SetStoreFunction<Armor>,
    armorCategory: Accessor<string>,
    setArmorCategory: Setter<string>,
    otherCategory: Accessor<string>,
    setOtherCategory: Setter<string>,
    styles: CSSModuleClasses,
    desc: Accessor<string>,
    setDesc: Setter<string>,
}

const ArmorCreate:Component<props> = (props) => {

  return <div>
    <h2>Armor Category</h2>
    <div>
      <Select
        transparent
        value={props.armorCategory()}
        onChange={(e)=>props.setArmorCategory(e)}
      >
        <For each={["Light","Medium","Heavy","Shield","Other"]}>
          { (armorType) => <Option value={armorType}>{armorType}</Option>}
        </For>
      </Select>

      <Show when={props.armorCategory() === "Other"}>
        <div>
          <FormField name="Other Category">
            <Input 
              type="text"
              transparent
              value={props.otherCategory()}
              onInput={(e)=>{
                props.setOtherCategory(e.currentTarget.value)
              }}
            />
          </FormField>
        </div>
      </Show>
    </div>

    <h2>Armor class</h2>
    <div>
      <div class={`${props.styles.checkbox}`}>
        <Input
          type="checkbox"
          checked={props.currentArmor.armorClass.dexBonus}
          name="dexBonus"
          onChange={(e)=>{
            if (e.currentTarget.checked) {
              props.setCurrentArmor("armorClass",old=>({
                base: old.base,
                dexBonus: true,
                maxBonus: old.maxBonus
              }))
            } else {
              props.setCurrentArmor("armorClass",old=>({
                base: old.base,
                dexBonus: false,
                maxBonus: old.maxBonus
              }))
            }
          }}
        /> <label for="dexBonus">dexterity Bonus</label>
      </div>

      <FormField name="base">
        <Input
          type="number"
          transparent
          value={props.currentArmor.armorClass.base}
          onInput={(e)=>props.setCurrentArmor("armorClass",old=>({
            base: parseInt(e.currentTarget.value),
            dexBonus: old.dexBonus,
            maxBonus: old.maxBonus,
          }))}
        />
      </FormField>

      <FormField name="Max Bonus">
        <Input 
          type="number"
          transparent
          value={props.currentArmor.armorClass.maxBonus}
          onInput={(e)=>props.setCurrentArmor("armorClass",old=>({
            base: old.base,
            dexBonus: old.dexBonus,
            maxBonus: parseInt(e.currentTarget.value),
          }))}
        />
      </FormField>

    </div>

    <h2>Strength Req</h2>
    <div>
      <FormField name="Strength Min">
        <Input 
          type="number"
          transparent
          value={props.currentArmor.strMin}
          onInput={(e)=>props.setCurrentArmor("strMin",parseInt(e.currentTarget.value))}
        />
      </FormField>
    </div>

    <div class={`${props.styles.checkbox}`}>
      <Input
        type="checkbox"
        checked={props.currentArmor.stealthDisadvantage}
        name="stealthDisavantage"
        onChange={(e)=>{
          if (e.currentTarget.checked) {
            props.setCurrentArmor("stealthDisadvantage",true)
          } else {
            props.setCurrentArmor("stealthDisadvantage",false)
          }
        }}
      /> <label for="stealthDisavantage">Stealth Disavantage</label>
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
        value={props.currentArmor.weight}
        onInput={(e)=>props.setCurrentArmor("weight",parseInt(e.currentTarget.value))}
      />
    </FormField>
    
  </div>
}

export default ArmorCreate