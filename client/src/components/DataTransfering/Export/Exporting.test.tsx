import {test, expect} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import Exporting from "./Exporting";

test("rendering",async () => {

  render(()=><Exporting />)
})