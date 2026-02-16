/// <reference types="flarum/@types/translator-icu-rich" />
export default class ProfileImageCropModal extends Modal<import("flarum/common/components/Modal").IInternalModalAttrs, undefined> {
    static isDismissible: boolean;
    constructor();
    title(): import("@askvortsov/rich-icu-message-formatter").NestedStringArray;
    oninit(vnode: any): void;
    image: string | ArrayBuffer | null | undefined;
    content(): JSX.Element;
    loadPicker(evt: any): Promise<void>;
    ready: boolean | undefined;
    cropper: Cropper | null | undefined;
    onbeforeupdate(vnode: any): void;
    disableResize(): void;
    noResize: boolean | undefined;
    disableCrop(): void;
    upload(): any;
    canvasToBlob(canvas: any): Promise<any>;
    submitBlob(blob: any): Promise<any>;
}
import Modal from "flarum/common/components/Modal";
