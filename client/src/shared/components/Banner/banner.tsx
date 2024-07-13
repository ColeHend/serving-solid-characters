import { Component } from "solid-js";

type Props = {
    styles: CSSModuleClasses;
}

const Banner: Component<Props> = (props) => {
    let styles = props.styles;

    return (
      <svg class={`${styles.banner}`} width="50" height="40" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M 15 5 L 35 5 L 35 45 L 25 35 L 15 45 Z" fill="none" stroke="white" stroke-width="2" />
      </svg>
    );
  };

export default Banner;