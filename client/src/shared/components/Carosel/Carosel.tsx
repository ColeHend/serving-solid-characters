import { Accessor, Component, createMemo, createSignal, For, JSX, Setter, splitProps } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./Carosel.module.scss";
import Button from "../Button/Button";
import { effect } from "solid-js/web";


interface CarouselProps {
    elements: {name:string, element: JSX.Element}[];
    startingIndex?: number;
    notFoundName?: string;
    currentIndex?: [Accessor<number>, Setter<number>];
}
  
const Carousel: Component<CarouselProps> = ({startingIndex = 0, ...props}) => {
    // ----- Signals -----
    const [internalIndex, setInternalIndex] = createSignal(startingIndex);
    const [propIndex, other] = splitProps(props, ["currentIndex"]);
    
    const getPropIndex = () => propIndex.currentIndex![0]();
    const setPropIndex = (index: number) => propIndex.currentIndex![1](index);
    
    // ----- Memoized Values -----
    const currentIndex = createMemo(()=>{
        if (props.elements.length === 2) {
            return getPropIndex();
        }
        return internalIndex();
    })
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

    // ----- Functions -----
    const nextSlide = () => {
        if (currentIndex() !== props.elements.length - 1) {
            setInternalIndex((old)=> old + 1);
        } else {
            setInternalIndex(0);
        }
    };
  
    const prevSlide = () => {
        if (currentIndex() !== 0) {
            setInternalIndex((old)=> old - 1);
        } else {
            setInternalIndex(props.elements.length - 1);
        }
    };
    // ----- Effects -----
    effect(()=>{
        if (!!props.currentIndex) {
            setPropIndex(currentIndex());
        }
    })
    // ----- TSX -----
  
    return (
      <div class={`${style.carousel}`}>
        <div class={`${style.carouselHeader}`}>
            <Button class={`${style.carouselButton}`} onClick={prevSlide}>
            &#10094;
            </Button>
            <div class={`${style.carouselSlides} ${style.header}`}>
                <div class={`${style.carouselSlide}`}>
                    {slideName()}
                </div>
            </div>
            <Button class={`${style.carouselButton} `} onClick={nextSlide}>
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