import { Component } from "solid-js";
import styles from "./Exporting.module.scss";
import { Button } from "../../../shared";

const Exporting:Component = () => {

		let x:any;

    return <div class={`${styles.wrapper}`}>
        
        <div class={`${styles.leftList}`}>
            <h2>Avalable Options</h2>
            
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
            <h2>Active Options</h2>
            
            <div class={`${styles.innerRow}`}>
                
                <ul class={`${styles.list}`}>

                </ul> 


            </div> 
            
            <Button class={`${styles.ExportBtn}`}>Export!</Button>
        </div>

    </div>
}

export default Exporting