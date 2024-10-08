import {test, expect, vi, inject} from "vitest";
import { render, screen } from "@solidjs/testing-library";
import DataTransferModal from "./dataTransferModal";
import { createSignal } from "solid-js";
import { useInjectServices,useStyle } from "../../shared";

const serviceMock = vi.hoisted(()=> {
    return {
        useInjectServices: vi.fn(),
    }
})

const useStyleMock = vi.hoisted(() => {
    return {
        useStyle: vi.fn()
    }
})

test("render", async () => {
    const [backClick, setBackClick] = createSignal<boolean>(false)

    // vi.doMock('../../shared/customHooks/injectServices',() => {
    //     return {
    //         useInjectServices: serviceMock.useInjectServices,
    //     }
    // });

    // vi.doMock(import('../../shared/customHooks/utility/style/styleHook'), async (importOriginal) => {
    //     const mod = await importOriginal()
    //     return {
    //         ...mod,
    //         useStyle: vi.fn(),
    //     }
    // });

    render(() => <DataTransferModal setBackClick={setBackClick} /> ) 
    
})