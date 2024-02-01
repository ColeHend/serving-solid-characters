import { createEffect, type Component } from 'solid-js';
import useDnDClasses from './customHooks/dndInfo/useDnDClasses';
import logo from './logo.svg';
import styles from './App.module.css';

const App: Component = () => {
  const [dndSrdClasses, dndSrdClassesInfo] = useDnDClasses();

  createEffect(()=>{
    console.log("dndSrdClasses", dndSrdClasses());
  });

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <div>Change</div>
      </header>
    </div>
  );
};

export default App;
