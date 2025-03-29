import { Component, createMemo, createSignal, Setter } from "solid-js";
import styles from "./classes.module.scss";
import { Armor, Item, useGetArmor, useGetItems, useGetWeapons, Weapon } from "../../../../../shared";
import { Modal, Select, Option, Input, FormField, Table, Column, Header, Cell, Row } from "coles-solid-library";
export const Items: Component= () => {
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [modalShown, setModalShown] = createSignal<undefined | 'items' | 'weapons' | 'armor'>();
  
  const [modalColumns, setModalColumns] = createSignal<string[]>(['name', 'description', 'weight', 'cost']);
  const [empty,] = createSignal<Item[]>([]);
  const allItems = useGetItems();
  const allWeapons = useGetWeapons();
  const allArmor = useGetArmor();
  const currentData = createMemo(() => {
    if (modalShown() === 'items') {
      return allItems();
    } else if (modalShown() === 'weapons') {
      return allWeapons();
    } else if (modalShown() === 'armor') {
      return allArmor();
    }
    return empty();
  });

  const setModalPatch: Setter<boolean> = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowModal(value);
    if (!value) {
      setModalShown();
      setModalColumns(['name', 'description', 'weight', 'cost']);
    } else if (modalShown() === 'items') {
      setModalColumns(['name', 'description', 'weight', 'cost']);
    } else if (modalShown() === 'weapons') {
      setModalColumns(['name', 'description', 'weight', 'cost', 'damage', 'range', 'weaponCategory']);
    } else if (modalShown() === 'armor') {
      setModalColumns(['name', 'description', 'weight', 'cost', 'armorClass', 'armorDisadv', 'armorType', 'armorCategory']);
    }
  }

  return (// Item choices a/b or whats given
    <div class={`${styles.classSection}`}>
      <div>
        Equipment
      </div>
      <div>
        <div>
          Weapons
        </div>
        <div>
          Armor
        </div>
        <div>
          Tools
        </div>
      </div>
      <Modal title="Choose Items" show={[showModal, setModalPatch]}>
        <div>
          <div>

          </div>
          <div>
            <Table data={currentData} columns={modalColumns()}>
              <Column name="name">
                <Header>Item</Header>
                <Cell<Item> >{(item)=> item.name}</Cell>
              </Column>
              <Column name="weight">
                <Header>Weight</Header>
                <Cell<Item> >{(item)=> item.weight}</Cell>
              </Column>
              <Column name="cost">
                <Header>Cost</Header>
                <Cell<Item> >{(item)=> <>{`${item.cost.quantity} ${item.cost.unit}`}</>}</Cell>
              </Column>
              <Column name="description">
                <Header>Description</Header>
                <Cell<Item> >{(item)=> <>{item.desc}</>}</Cell>
              </Column>

              <Column name="damage">
                <Header>Damage</Header>
                <Cell<Weapon> >{(weapon)=><>
                  {weapon.damage?.map((d)=>`${d.damageDice}${d.damageBonus ? `+ ${d.damageBonus}` : ''}${' ' + d.damageType}`).join(',\n')}
                </>}</Cell>
              </Column>
              <Column name="range">
                <Header>Range</Header>
                <Cell<Weapon> >{(item)=> <>{item.weaponRange}</>}</Cell>
              </Column>
              <Column name="weaponCategory">
                <Header>Weapon Category</Header>
                <Cell<Weapon> >{(item)=> <>{item.weaponCategory}</>}</Cell>
              </Column>

              <Column name="armorClass">
                <Header>Armor Class</Header>
                <Cell<Armor> >{(item)=> <>{item.armorClass}</>}</Cell>
              </Column>
              <Column name="armorDisadv">
                <Header>Stealth Disadvantage</Header>
                <Cell<Armor> >{(item)=> <>{item.stealthDisadvantage}</>}</Cell>
              </Column>
              <Column name="armorType">
                <Header>Armor Type</Header>
                <Cell<Armor> >{(item)=> <>{item.strMin > 0 ? item.strMin : '-'}</>}</Cell>
              </Column>
              <Column name="armorCategory">
                <Header>Armor Category</Header>
                <Cell<Armor> >{(item)=> <>{item.armorCategory}</>}</Cell>
              </Column>

            </Table>
          </div>
        </div>
      </Modal>
    </div>
  );
};