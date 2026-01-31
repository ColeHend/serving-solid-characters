import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import ViewClasses from './viewClasses';

test("render",async () => {

  render(()=><Router>
    <Route path='/info/classes' component={ViewClasses} />
  </Router>)
})