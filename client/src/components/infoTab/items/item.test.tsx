import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import ItemsViewTab from "./item";

test("render",async () => {

    render(()=><Router>
        <Route path='/info/items' component={ItemsViewTab} />
    </Router>)
})