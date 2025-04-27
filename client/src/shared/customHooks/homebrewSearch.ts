import { Observable, take, tap, of, concatMap, OperatorFunction, catchError, finalize, endWith, retry } from "rxjs";
import { Accessor, Setter, createSignal } from "solid-js";
import { Clone } from "./utility/tools/Tools";
import { Background, DnDClass, Feat, Item, Race, Spell } from "../../models";
import homebrewManager from "./homebrewManager";
import useGetRaces from "./dndInfo/oldSrdinfo/data/useGetRaces";
import addSnackbar from "../components/Snackbar/snackbar";

class HomebrewSearch {
  public searchName: string;

  constructor (SearchName:string) {
    this.searchName = SearchName;
  }


  public races() {

    let srdRaces:Race[] = [];

    homebrewManager.races().forEach(homerace => {
      srdRaces = Clone(useGetRaces()()).filter(x=>x.name !== homerace.name);
    })
    


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


  public dndClasses():DnDClass {

    return {} as DnDClass
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