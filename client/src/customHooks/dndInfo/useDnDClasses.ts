import { createSignal, createResource, createEffect } from "solid-js";
import type { Accessor, Setter, Resource } from "solid-js";
import type { DnDClass } from "../../models/class.model";
import httpClient from "../utility/httpClient";
const getClasses = async () => {
    if (classes().length === 0){
        return (await httpClient.post("/api/DnDInfo/Classes")).json();
    } else {
        return new Promise((resolve) => resolve(classes()))
    }
};

const [classes, setClasses] = createSignal<DnDClass[]>([]);

export default function useDnDClasses(): [Accessor<DnDClass[]>, {
    loading: boolean;
    error: any;
}]{
    const [newClasses, {mutate, refetch}] = createResource<DnDClass[]>(getClasses);
    createEffect(()=>{
        setClasses(newClasses() ?? [])
    });
    return [classes, {
        loading: newClasses.loading,
        error: newClasses.error,
    }];
}