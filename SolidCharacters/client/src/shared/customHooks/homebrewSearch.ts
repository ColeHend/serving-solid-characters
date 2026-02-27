import { Observable, take, tap, of, concatMap, OperatorFunction, catchError, finalize, endWith, retry } from "rxjs";
import { Accessor, Setter, createSignal } from "solid-js";
import { Clone } from "./utility/tools/Tools";
import { Background, Class5E, Feat, Item, Race, Spell } from "../../models/generated";
import homebrewManager from "./homebrewManager";
import {addSnackbar} from "coles-solid-library";

class HomebrewSearch {
  public searchName: string;

  constructor (SearchName:string) {
    this.searchName = SearchName;
  }


  public races() {

    let srdRaces:Race[] = [];

    // homebrewManager.races().forEach(homerace => {
    //   srdRaces = Clone(useGetRaces()()).filter(x=>x.name !== homerace.name);
    // })
    


    addSnackbar({
      severity:"info",
      message:"Searching Homebrew",
      closeTimeout:4000
    })

    if (srdRaces.length > 0) {
      const SrdRaces = srdRaces.sort((a, b) => a.name.localeCompare(b.name))

      addSnackbar({
        severity:"info",
        message:"Searching Srd",
        closeTimeout:4000
      })

      return SrdRaces.find(r=>r.name === this.searchName);
    }

  }


  public dndClasses():Class5E {

    return {} as Class5E
  }


  public feats():Feat {

    return {} as Feat
  }   


  public items() {

  }


  public spells():Spell {

    return {} as Spell
  }


  public background():Background {
        
    return {} as Background
  }



    
}
export { HomebrewSearch };
export default HomebrewSearch;