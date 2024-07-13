import { Component } from "solid-js";
import useStyle from "../../shared/customHooks/utility/style/styleHook";
import Carousel from "../../shared/components/Carosel/Carosel";

const Homebrew: Component = () => {
    const stylin = useStyle();
    const elements = [
        {name: "Element A", element: <div>Element 1</div>},
        {name: "Element 2", element: <div>Element 2</div>},
        {name: "Element fred", element: <div>Element 3</div>},
        {name: "Elem fff", element: <div>Element 4</div>},
    ];     
    return (
        <div class={`${stylin.accent}`}>
            <h1>Homebrew</h1>
            <Carousel elements={elements} />
        </div>
    );
}
export default Homebrew;