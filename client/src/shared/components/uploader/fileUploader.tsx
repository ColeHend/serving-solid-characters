import { Component, createSignal, Setter, splitProps } from "solid-js";
import { createFileUploader, FileUploaderDirective } from "@solid-primitives/upload";
import Modal from "../popup/popup.component";
import httpClient$ from "../../customHooks/utility/httpClientObs";
import { take, tap } from "rxjs";
import Button from "../Button/Button";
import { effect } from "solid-js/web";
import { useInjectServices } from "../..";

declare module "solid-js" {
    namespace JSX {
      interface Directives {
        fileUploader: FileUploaderDirective
      }
    }
  }

interface Props {
    uploadType?: "image" | "file";
    setData: Setter<string>;
}
const FileUploader:Component<Props> = (props) => {
    const [customProps, normalProps] = splitProps(props, ["uploadType", "setData"]);
    const { files, selectFiles } = createFileUploader({ accept: customProps.uploadType === "image" ? "image/*" : "file/*" });
    const services = useInjectServices();
    return (
        <Modal width={services.isMobile() ? "80vw" : "45vw"} height={services.isMobile() ? "45vh" : "60vh"}>
            <div>
                <h1>Modal</h1>
                <div>
                    <h2>Upload And image to parse text from</h2>
                    <Button onClick={(e)=>{
                        selectFiles(([fileSRC])=> {
                            
                            httpClient$.toObservable(fileSRC.file.arrayBuffer()).pipe(
                                take(1),
                                tap((file)=>{
                                    const fileType = fileSRC.name.split(".")[(fileSRC.name.split(".").length - 1)];
                                    const imageDat = new Uint8Array(file);
                                    const blob = new Blob([imageDat], {type: `image/${fileType}`});
                                    props.setData(URL.createObjectURL(blob));
                                })
                            ).subscribe();
                        });
                    }}>Upload</Button>
                </div>
            </div>
        </Modal>
    );
};
export { FileUploader };
export default FileUploader;