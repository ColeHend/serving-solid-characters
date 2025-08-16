import { Component, createMemo, createSignal, } from "solid-js";
import { Body, Carousel } from "coles-solid-library";
import Table from "./table/Table";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { homebrewManager, MenuButton } from "../../../shared";

const View: Component = () => {

  const navigate = useNavigate();
  const elementMemo = createMemo(() => [
    {
      name: "Spells", element: <Table data={homebrewManager.spells()} keys={["name", "level"]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/spells?name=${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
          ] as MenuButton[])
        }}
      />
    },
    {
      name: "Feats", element: <Table data={homebrewManager.feats()} keys={["name"]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/feats?name=${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
          ] as MenuButton[])
        }}
      />
    },
    {
      name: "Classes", element: <Table
        data={homebrewManager.classes()}
        keys={["name", "hitDie"]}
        paginator={[5, 10, 25, 50, 100]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/classes?name=${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
          ] as MenuButton[])
        }}
      />
    },
    {
      name: "Subclasses", element: <Table
        data={homebrewManager.classes().flatMap(x => x.subclasses)}
        keys={["name", "class"]}
        paginator={[5, 10, 25, 50, 100]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/subclasses?name=${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
          ] as MenuButton[])
        }}
      />
    },
    {
      name: "Items", element: <Table data={homebrewManager.items()} keys={["name"]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/itemsitems?itemType=${data.equipmentCategory}&name=${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
          ] as MenuButton[])
        }}
      />
    },
    {
      name: "Backgrounds", element: <Table data={homebrewManager.backgrounds()} keys={["name"]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/backgrounds?name=${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
          ] as MenuButton[])
        }}
      />
    },
    {
      name: "Races", element: <Table data={homebrewManager.races()} keys={["name"]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/races?name=${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
          ] as MenuButton[])
        }}
      />
    },
    {
      name: "Subraces", element: <Table data={homebrewManager.races().flatMap(x => x.subRaces)} keys={["name"]}
        button={{
          backgroundClick: true,
          generateMenuButtons: (data) => ([
            { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/races?name="${data.name}`) } },
            { name: "Delete", condition: () => true, action: () => { console.log("delete", data) } }
          ] as MenuButton[])
        }}
      />
    },
  ]);
  const [searchParam, setSearchParam] = useSearchParams();
  if (!searchParam.name) setSearchParam({ name: elementMemo()[0].name });
  const startingIndex = createMemo(() => elementMemo().findIndex((x) => x.name.toLowerCase() === searchParam.name?.toLowerCase()));
  effect(() => {
    console.log("startingIndex", startingIndex());
    console.log("searchParam", searchParam.name);
  })
  const [homebrewIndex, setHomebrewIndex] = createSignal<number>(startingIndex());
  effect(() => {
    setSearchParam({ name: elementMemo()[homebrewIndex()].name ?? "spells" })
  })
  return (
    <Body>
      <h1>View</h1>
      <div style={{ "text-align": "left" }}>
        <Carousel startingIndex={startingIndex()} currentIndex={[homebrewIndex, setHomebrewIndex]} elements={elementMemo()} />
      </div>
    </Body>
  );
}
export default View;