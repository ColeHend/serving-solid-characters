import {test} from "vitest";
import { render } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Backgrounds from "./backgrounds";

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew/backgrounds' component={Backgrounds} />
  </Router>)
});