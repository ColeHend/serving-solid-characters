import {test} from "vitest";
import { render} from "@solidjs/testing-library";
import Viewbackgrounds from './backgrounds';
import { Route, Router } from "@solidjs/router";

test("render",async () => {

  render(()=><Router>
    <Route path='/info/backgrounds' component={Viewbackgrounds} />
  </Router>);
})