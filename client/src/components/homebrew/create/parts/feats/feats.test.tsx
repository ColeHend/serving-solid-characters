import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Feats from "./feats";

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew/feats' component={Feats} />
  </Router>)
})