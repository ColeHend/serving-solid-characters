import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Spells from "./spells";

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew/spells' component={Spells} />
  </Router>)
})