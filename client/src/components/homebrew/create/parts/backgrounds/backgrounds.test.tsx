import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Backgrounds from "./backgrounds";

test("render",async () => {

    render(()=><Router>
        <Route path='/homebrew/backgrounds' component={Backgrounds} />
    </Router>)
});