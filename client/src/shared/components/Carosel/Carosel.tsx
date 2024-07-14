// @ts-nocheck
import { Component, createMemo, createSignal, For, JSX } from "solid-js";
import useStyles from "../../../../customHooks/utility/style/styleHook";
import style from "./Carosel.module.scss";
import Button from "../Button/Button";
import { effect } from "solid-js/web";


interface CarouselProps {
    elements: {name:string, element: JSX.Element}[];
    notFoundName?: string;
}
  
const Carousel: Component<CarouselProps> = (props) => {
    const [currentIndex, setCurrentIndex] = createSignal(0);
  
    const nextSlide = () => {
        if (currentIndex() !== props.elements.length - 1) {
            setCurrentIndex((old)=> old + 1);
        } else {
            setCurrentIndex(0);
        }
    };
  
    const prevSlide = () => {
        if (currentIndex() !== 0) {
            setCurrentIndex((old)=> old - 1);
        } else {
            setCurrentIndex(props.elements.length - 1);
        }
    };

    const slideName = createMemo(()=>{
        if (props.elements.length > 0) {
            return props.elements[currentIndex()].name;
        }
        return !!props.notFoundName ? `No ${props.notFoundName} Found` : "No Elements Found";
    });
    const slideElement = createMemo(()=>{
        if (props.elements.length > 0) {
            return props.elements[currentIndex()].element;
        }
        return !!props.notFoundName ? <div>No {props.notFoundName} Found</div> : <div>No Elements Found</div>;
    });
  
    return (
      <div class={`${style.carousel}`}>
        <div class={`${style.carouselHeader}`}>
            <Button class={`${style.carouselButton}`} on:click={prevSlide}>
            &#10094;
            </Button>
            <div class={`${style.carouselSlides} ${style.header}`}>
                <div class={`${style.carouselSlide}`}>
                    {slideName()}
                </div>
            </div>
            <Button class={`${style.carouselButton} `} on:click={nextSlide}>
            &#10095;
            </Button>
        </div>
        <div class={`${style.carouselSlide}`}>
            {slideElement()}
        </div>
      </div>
    );
  };
  
  export { Carousel };
  export default Carousel;