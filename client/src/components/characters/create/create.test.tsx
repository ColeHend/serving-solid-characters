import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Create from "./create";

test("render",async () => {

    render(()=><Router>
        <Route path='/characters/create' component={Create} />
    </Router>)
})