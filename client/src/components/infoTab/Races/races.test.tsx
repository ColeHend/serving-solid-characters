import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Races from './races';

test("render",async () => {

  render(()=><Router>
    <Route path='/info/races' component={Races} />
  </Router>)
})