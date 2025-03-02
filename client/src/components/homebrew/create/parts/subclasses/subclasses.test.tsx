import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Subclasses from "./subclasses";

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew/subclasses' component={Subclasses} />
  </Router>)
})