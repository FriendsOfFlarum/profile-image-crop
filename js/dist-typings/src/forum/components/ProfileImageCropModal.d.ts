/// <reference types="mithril" />
import Modal from 'flarum/common/components/Modal';
import Cropper from 'cropperjs';
export default class ProfileImageCropModal extends Modal {
    static isDismissibleViaCloseButton: boolean;
    static isDismissibleViaEscKey: boolean;
    static isDismissibleViaBackdropClick: boolean;
    image: string | ArrayBuffer | null;
    ready: boolean;
    loading: boolean;
    cropper: InstanceType<typeof Cropper> | null;
    className(): string;
    title(): string | any[];
    oninit(vnode: any): void;
    content(): JSX.Element;
    loadPicker(evt: Event): void;
    onbeforeupdate(vnode: any): void;
    disableCrop(): void;
    upload(): Promise<void>;
    resizeCanvas(canvas: HTMLCanvasElement, maxSize: number): HTMLCanvasElement;
    canvasToBlob(canvas: HTMLCanvasElement, type?: string): Promise<Blob>;
    submitBlob(blob: Blob): Promise<void>;
}
