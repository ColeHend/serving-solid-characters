import { Component } from "solid-js";
import { Carousel, Body} from "../../shared/";

const Homebrew: Component = () => {
  const elements = [
    {name: "Element A", element: <div>Element 1</div>},
    {name: "Element 2", element: <div>Element 2</div>},
    {name: "Element fred", element: <div>Element 3</div>},
    {name: "Elem fff", element: <div>Element 4</div>},
  ];     
  return (
    <Body>
      <h1>Homebrew</h1>
      <Carousel elements={elements} />
    </Body>
  );
}
export default Homebrew;