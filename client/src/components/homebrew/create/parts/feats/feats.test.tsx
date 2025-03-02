import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Feats from "./feats";

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew/feats' component={Feats} />
  </Router>)
})