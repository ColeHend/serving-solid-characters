import { Component, JSX } from "solid-js";
interface ArrowProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}
export const UpArrow: Component<ArrowProps> = (props) => {
  return (
    <svg width="46" height="44" {...props} viewBox="0 0 46 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24.15 12.7875L37.6625 25.575C39.1 26.95 39.1 29.15 37.6625 30.525C36.225 31.9 33.925 31.9 32.4875 30.525L24.15 22.6875C23.4312 22 22.425 22 21.7062 22.6875L13.3687 30.525C11.9312 31.9 9.63123 31.9 8.19373 30.525C6.75623 29.15 6.75623 26.95 8.19373 25.575L21.7062 12.7875C22.425 12.2375 23.575 12.2375 24.15 12.7875Z" stroke="white" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  );
};

export const DownArrow: Component<ArrowProps> = (props) => {
  return (
    <svg width="44" height="43" {...props} viewBox="0 0 44 43" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.7625 31.8469L7.83752 19.35C6.46252 18.0062 6.46252 15.8562 7.83752 14.5125C9.21252 13.1687 11.4125 13.1687 12.7875 14.5125L20.7625 22.1719C21.45 22.8437 22.4125 22.8437 23.1 22.1719L31.075 14.5125C32.45 13.1687 34.65 13.1687 36.025 14.5125C37.4 15.8562 37.4 18.0062 36.025 19.35L23.1 31.8469C22.55 32.3844 21.45 32.3844 20.7625 31.8469Z" stroke="white" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  )
};