import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Races from "./races";

test("render",async () => {

  render(()=><Router>
    <Route path='homebrew/race' component={Races} />
  </Router>)
})