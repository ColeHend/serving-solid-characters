import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Subclasses from "./subclasses";

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew/subclasses' component={Subclasses} />
  </Router>)
})