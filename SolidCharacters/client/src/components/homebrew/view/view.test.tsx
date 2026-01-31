import {test} from "vitest";
import { render } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import View from './view';

test("render", async () => {

  render(()=><Router>
    <Route path='/homebrew/view' component={View} />
  </Router>)
})