import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import featsList from "./feats"

test("render",async () => {

  render(()=><Router>
    <Route path='/info/feats' component={featsList} />
  </Router>)
})