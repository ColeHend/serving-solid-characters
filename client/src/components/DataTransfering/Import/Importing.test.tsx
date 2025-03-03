import {test} from "vitest";
import { render } from "@solidjs/testing-library";
import Importing from "./Importing";

test("rendering",async ()=> {

  render(()=><Importing />)
})