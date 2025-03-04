import {test} from "vitest";
import { render } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Homebrew from './homebrew';

test("render",async () => {

  render(()=><Router>
    <Route path='/homebrew' component={Homebrew} />
  </Router>)
})