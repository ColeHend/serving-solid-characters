import { Component } from "solid-js";
import styles from "./Exporting.module.scss";
import { Button } from "../../../shared";

const Exporting:Component = () => {



    return <div class={`${styles.wrapper}`}>
        
        <div class={`${styles.leftList}`}>
            <h2>avalable Options</h2>
            
            <div class={`${styles.innerRow}`}>
                <ul class={`${styles.list}`}>

                </ul> 

                <div class={`${styles.switchBtns}`}>
                    <Button>→</Button>
                    <Button>←</Button>
                </div>
            </div>

            
        </div>

        <div class={`${styles.divider}`}>

        </div>

        <div class={`${styles.rightList}`}>
            <h2>active Options</h2>
            
            <div class={`${styles.innerRow}`}>
                
                <ul class={`${styles.list}`}>

                </ul> 


            </div> 
            
            <Button class={`${styles.ExportBtn}`}>Export!</Button>
        </div>

    </div>
}

export default Exporting