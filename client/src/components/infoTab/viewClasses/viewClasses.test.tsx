import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import ViewClasses from './viewClasses';

test("render",async () => {

    render(()=><Router>
        <Route path='/info/classes' component={ViewClasses} />
    </Router>)
})