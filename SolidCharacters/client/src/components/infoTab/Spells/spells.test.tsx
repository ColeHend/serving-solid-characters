import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import masterSpells from "./Spells";

test("render",async () => {

  render(()=><Router>
    <Route path='/info/spells' component={masterSpells} />
  </Router>)
})