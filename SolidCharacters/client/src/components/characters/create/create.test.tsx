import {test} from "vitest";
import { render } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Create from "./create";

test("render",async () => {

  render(()=><Router>
    <Route path='/characters/create' component={Create} />
  </Router>)
})