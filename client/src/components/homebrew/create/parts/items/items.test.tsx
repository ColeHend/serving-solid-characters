import {test} from "vitest";
import { render } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Items from "./items";

test("render",async () => {

  render(()=> <Router>
    <Route path='/homebrew/items' component={Items} />
  </Router>)
})