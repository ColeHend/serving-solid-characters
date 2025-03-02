import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Characters from "./characters";

test("render",async () => {

  render(()=><Router>
    <Route path='/characters' component={Characters} />
  </Router>)
})