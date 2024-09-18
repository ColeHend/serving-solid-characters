import { Component, JSX } from "solid-js";

interface CalculatorProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export const Calculator:Component<CalculatorProps> = (props) => {

    return <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" {...props} viewBox="0 0 200 300" fill="none">
    {/* <!-- Calculator body --> */}
    <rect x="10" y="10" width="180" height="280" rx="20" fill="#E0E0E0" stroke="#B0B0B0" stroke-width="2"/>
    
    {/* <!-- Display --> */}
    <rect x="20" y="20" width="160" height="50" rx="10" fill="#FFFFFF" stroke="#B0B0B0" stroke-width="1"/>
    
    {/* <!-- Buttons --> */}
    {/* <!-- Row 1 --> */}
    <rect x="20" y="90" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    <rect x="70" y="90" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    <rect x="120" y="90" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    
    {/* <!-- Row 2 --> */}
    <rect x="20" y="140" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    <rect x="70" y="140" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    <rect x="120" y="140" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    
    {/* <!-- Row 3 --> */}
    <rect x="20" y="190" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    <rect x="70" y="190" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    <rect x="120" y="190" width="40" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
    
    {/* <!-- Row 4 --> */}
    <rect x="20" y="240" width="150" height="40" rx="8" fill="#F0F0F0" stroke="#B0B0B0" stroke-width="1"/>
  </svg>
  
}