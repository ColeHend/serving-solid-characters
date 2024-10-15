import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import Importing from "./Importing";

test("rendering",async ()=> {

    render(()=><Importing />)
})