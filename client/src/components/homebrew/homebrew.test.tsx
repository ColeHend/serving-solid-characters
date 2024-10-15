import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Homebrew from './homebrew';

test("render",async () => {

    render(()=><Router>
        <Route path='/homebrew' component={Homebrew} />
    </Router>)
})