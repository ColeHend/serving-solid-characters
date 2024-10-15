import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Create from './create';

test("Render",async () => {

    render(()=><Router>
        <Route path='/homebrew/create' component={Create} />
    </Router>)
})