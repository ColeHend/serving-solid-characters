import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Classes from "./classes";

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew/classes' component={Classes} />
  </Router>)
})