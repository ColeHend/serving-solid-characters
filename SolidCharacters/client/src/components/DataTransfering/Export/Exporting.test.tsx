import {test} from "vitest";
import { render } from "@solidjs/testing-library";
import Exporting from "./Exporting";

test("rendering",async () => {

  render(()=><Exporting />)
})