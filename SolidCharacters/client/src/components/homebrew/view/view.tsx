import { Component, createMemo, createSignal, } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Body } from "coles-solid-library";

const View: Component = () => {

  const navigate = useNavigate();
  // const elementMemo = createMemo(() => [
  //   {
  //     name: "Spells", element: <Table data={homebrewManager.spells()} keys={["name", "level"]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/spells?name=${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  //   {
  //     name: "Feats", element: <Table data={homebrewManager.feats()} keys={["name"]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/feats?name=${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  //   {
  //     name: "Classes", element: <Table
  //       data={homebrewManager.classes()}
  //       keys={["name", "hit_die"]}
  //       paginator={[5, 10, 25, 50, 100]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/classes?name=${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  //   {
  //     name: "Subclasses", element: <Table
  //       data={homebrewManager.classes().flatMap(x => x.subclasses)}
  //       keys={["name", "class"]}
  //       paginator={[5, 10, 25, 50, 100]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/subclasses?name=${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  //   {
  //     name: "Items", element: <Table data={homebrewManager.items()} keys={["name"]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/itemsitems?itemType=${data.equipmentCategory}&name=${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  //   {
  //     name: "Backgrounds", element: <Table data={homebrewManager.backgrounds()} keys={["name"]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/backgrounds?name=${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  //   {
  //     // Added size column so homebrew race size edits are visible in the view tab
  //     name: "Races", element: <Table data={homebrewManager.races()} keys={["name","size"]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/races?name=${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("Delete", data); } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  //   {
  //     // Show size for subraces as well when present
  //     name: "Subraces", element: <Table data={homebrewManager.races().flatMap(x => x.subRaces)} keys={["name","size"]}
  //       button={{
  //         backgroundClick: true,
  //         generateMenuButtons: (data) => ([
  //           { name: "Edit", condition: () => true, action: () => { navigate(`/homebrew/create/races?name="${data.name}`) } },
  //           { name: "Delete", condition: () => true, action: () => { console.log("delete", data) } }
  //         ] as MenuButton[])
  //       }}
  //     />
  //   },
  // ]);
  // const [searchParam, setSearchParam] = useSearchParams();
  // if (!searchParam.name) setSearchParam({ name: elementMemo()[0].name });
  // const startingIndex = createMemo(() => elementMemo().findIndex((x) => x.name.toLowerCase() === searchParam.name?.toLowerCase()));
  // effect(() => {
  //   console.log("startingIndex", startingIndex());
  //   console.log("searchParam", searchParam.name);
  // })
  // const [homebrewIndex, setHomebrewIndex] = createSignal<number>(startingIndex());
  // effect(() => {
  //   setSearchParam({ name: elementMemo()[homebrewIndex()].name ?? "spells" })
  // })
  return (
    <></>
  );
}
export default View;