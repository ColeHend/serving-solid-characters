import { Accessor, Component, Setter } from "solid-js";
import { Item } from "../../../../../../../shared";
import { FormField, Input, TextArea } from "coles-solid-library";
import { SetStoreFunction } from "solid-js/store";

interface props {
    currentItem:Item
    setCurrentItem: SetStoreFunction<Item>
    desc: Accessor<string>,
    setDesc: Setter<string>,
}

const ItemCreate:Component<props> = (props) => {

  return <div>
    <h2>Description</h2>
    <FormField name="Item desc">
      <TextArea
        text={props.desc}
        setText={props.setDesc}
        transparent
      />
    </FormField>

    <h2>Weight</h2>
    <FormField name="Item Weight">
      <Input
        type="number"
        transparent
        value={props.currentItem.weight}
        onInput={(e) =>
          props.setCurrentItem("weight", parseInt(e.currentTarget.value))
        }
      />
    </FormField>
  </div>
}

export default ItemCreate;