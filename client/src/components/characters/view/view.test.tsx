import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import View from "./view";

test("render",async () => {

    render(()=><Router>
        <Route path="/characters/view" component={View} />
    </Router>)
})