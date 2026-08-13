import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Cropper from 'cropperjs';
import type Mithril from 'mithril';
export interface IProfileImageCropModalAttrs extends IInternalModalAttrs {
    file: File;
    upload: (file: File) => Promise<void>;
}
export default class ProfileImageCropModal extends Modal<IProfileImageCropModalAttrs> {
    static isDismissibleViaCloseButton: boolean;
    static isDismissibleViaEscKey: boolean;
    static isDismissibleViaBackdropClick: boolean;
    image: string | null;
    ready: boolean;
    cropper: Cropper | null;
    /**
     * The shorter edge of the source image, in its own pixels.
     */
    sourceSize: number;
    className(): string;
    title(): string | any[];
    oninit(vnode: Mithril.Vnode<IProfileImageCropModalAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<IProfileImageCropModalAttrs, this>): void;
    content(): JSX.Element;
    loadPicker(evt: Event): void;
    /**
     * The current crop size in source-image pixels (shorter edge), or null if
     * it can't be determined.
     *
     * The selection is measured in the canvas' coordinate space. The horizontal
     * scale of the image's transform is how many canvas pixels one source pixel
     * occupies — `$toCanvas()` uses the same matrix to render the crop — so
     * dividing by it converts a selection size back to source pixels.
     */
    cropSize(): number | null;
    /**
     * Whether the current crop is too small to generate all of core's avatar
     * variants. Only enforced when the source image is large enough that a
     * better crop is actually possible.
     */
    cropTooSmall(): boolean;
    disableCrop(): void;
    protected destroyCropper(): void;
    upload(): Promise<void>;
    /**
     * Encode a canvas to WebP, matching the format core stores avatars in.
     */
    canvasToFile(canvas: HTMLCanvasElement, type?: string): Promise<File>;
    submitFile(file: File): Promise<void>;
    protected showError(error: unknown): void;
}
