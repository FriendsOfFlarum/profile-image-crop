import app from 'flarum/forum/app';

import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

import Cropper from 'cropperjs';

import type Mithril from 'mithril';

/**
 * The longest edge, in pixels, of the cropped image we upload.
 *
 * Core generates avatar variants at 100px (1x), 200px (@2x) and 300px (@3x),
 * and never upscales — a variant is skipped entirely when the source is
 * smaller than the target. Uploading at least 300px therefore ensures all
 * three variants are generated and `avatarSrcset` is populated.
 *
 * We cap rather than upload the crop at its natural resolution so that large
 * source images (e.g. a 6000x4000 photo) don't exceed core's 2MB upload limit.
 *
 * @see https://github.com/flarum/framework/blob/2.x/framework/core/src/User/AvatarUploader.php
 */
const MAX_SIZE = 512;

/**
 * The smallest crop, in source-image pixels, that can be submitted.
 *
 * This matches core's largest avatar variant (@3x), so any permitted crop
 * yields a full `avatarSrcset`. Rather than fighting the cropper's drag
 * interactions, the floor is enforced at submit time: while the crop is too
 * small the submit button is disabled and a message explains why.
 */
const MIN_SIZE = 300;

export interface IProfileImageCropModalAttrs extends IInternalModalAttrs {
  file: File;
  upload: (file: File) => Promise<void>;
}

export default class ProfileImageCropModal extends Modal<IProfileImageCropModalAttrs> {
  static isDismissibleViaCloseButton = true;
  static isDismissibleViaEscKey = false;
  static isDismissibleViaBackdropClick = false;

  image: string | null = null;
  ready = false;
  cropper: Cropper | null = null;

  /**
   * The shorter edge of the source image, in its own pixels.
   */
  sourceSize = 0;

  className() {
    return 'FofProfileImageCropModal Modal--small';
  }

  title() {
    return app.translator.trans('core.forum.user.avatar_upload_button');
  }

  oninit(vnode: Mithril.Vnode<IProfileImageCropModalAttrs, this>) {
    super.oninit(vnode);

    const reader = new FileReader();

    reader.addEventListener('load', () => {
      this.image = reader.result as string;
      m.redraw();
    });

    reader.readAsDataURL(this.attrs.file);
  }

  onremove(vnode: Mithril.VnodeDOM<IProfileImageCropModalAttrs, this>) {
    super.onremove(vnode);

    this.destroyCropper();
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Image-container">
          {!this.ready && <LoadingIndicator size="tiny" />}
          {this.image && <img src={this.image} data-ready={!!this.ready} onload={this.loadPicker.bind(this)} />}
        </div>

        <br />

        {this.cropTooSmall() && (
          <p className="helpText FofProfileImageCropModal-sizeWarning">
            {app.translator.trans('fof-profile-image-crop.forum.modal.crop_too_small', { size: MIN_SIZE })}
          </p>
        )}

        {this.ready && this.cropper && (
          <p className="helpText">
            {app.translator.trans('fof-profile-image-crop.forum.modal.help_text', {
              disableCrop: <a onclick={this.disableCrop.bind(this)} />,
            })}
          </p>
        )}

        <div className="Modal-buttons">
          <Button
            type="button"
            className="Button Button--primary"
            loading={this.loading}
            onclick={(e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              this.upload();
            }}
            disabled={!this.ready || this.cropTooSmall()}
          >
            {app.translator.trans(`fof-profile-image-crop.forum.modal.${this.cropper ? 'submit_crop' : 'submit'}_button`)}
          </Button>

          <Button
            className="Button Button--icon Button--danger"
            icon="fas fa-times"
            aria-label={app.translator.trans('core.lib.modal.close')}
            onclick={this.hide.bind(this)}
          />
        </div>
      </div>
    );
  }

  loadPicker(evt: Event) {
    const target = evt.target as HTMLImageElement;

    this.ready = true;

    // Read the source dimensions here, while we still have the original <img>:
    // cropper replaces it with its own element on initialisation.
    this.sourceSize = Math.min(target.naturalWidth, target.naturalHeight);

    this.cropper = new Cropper(target, {
      container: target.parentElement!,
    });

    const selection = this.cropper.getCropperSelection();

    if (selection) {
      selection.aspectRatio = 1;
      selection.movable = true;
      selection.resizable = true;

      // Refreshes the size gate under the image as the selection changes.
      // Strictly read-only: this listener must never write back to the
      // cropper or cancel its events.
      selection.addEventListener('change', () => m.redraw());
    }

    // Zooming or panning the image changes how many source pixels the
    // selection covers without any selection `change` firing, so refresh the
    // gate on transform changes too. Read-only, like the listener above.
    this.cropper.getCropperImage()?.addEventListener('transform', () => m.redraw());

    m.redraw();
  }

  /**
   * The current crop size in source-image pixels (shorter edge), or null if
   * it can't be determined.
   *
   * The selection is measured in the canvas' coordinate space. The horizontal
   * scale of the image's transform is how many canvas pixels one source pixel
   * occupies — `$toCanvas()` uses the same matrix to render the crop — so
   * dividing by it converts a selection size back to source pixels.
   */
  cropSize(): number | null {
    const selection = this.cropper?.getCropperSelection();
    const image = this.cropper?.getCropperImage() as
      | (NonNullable<ReturnType<Cropper['getCropperImage']>> & { $getTransform?: () => number[] })
      | null;

    if (!selection || !image || !selection.width || !selection.height || !this.sourceSize) return null;

    // `$getTransform` is a private API; fall back to comparing the rendered
    // and natural widths if it ever disappears.
    const scale = image.$getTransform?.()[0] ?? image.getBoundingClientRect().width / this.sourceSize;

    if (!scale || !isFinite(scale) || scale <= 0) return null;

    return Math.round(Math.min(selection.width, selection.height) / scale);
  }

  /**
   * Whether the current crop is too small to generate all of core's avatar
   * variants. Only enforced when the source image is large enough that a
   * better crop is actually possible.
   */
  cropTooSmall(): boolean {
    if (!this.cropper || this.sourceSize < MIN_SIZE) return false;

    const size = this.cropSize();

    return size !== null && size < MIN_SIZE;
  }

  disableCrop() {
    this.destroyCropper();

    m.redraw();
  }

  protected destroyCropper() {
    this.cropper?.destroy();
    this.cropper = null;
  }

  async upload(): Promise<void> {
    // The disabled button already prevents this; the extra check guards
    // against a stale render.
    if (this.loading || this.cropTooSmall()) return;

    this.loading = true;

    // Without a cropper — either the user disabled cropping, or the image is
    // animated — the original file is uploaded untouched, letting core resize
    // and encode it.
    if (!this.cropper) {
      return this.submitFile(this.attrs.file);
    }

    try {
      const selection = this.cropper.getCropperSelection();

      if (!selection) {
        return this.submitFile(this.attrs.file);
      }

      // Let cropper scale the crop as it renders, rather than drawing it at
      // full resolution and downscaling it in a second pass.
      const scale = Math.min(MAX_SIZE / selection.width, MAX_SIZE / selection.height, 1);
      const canvas = await selection.$toCanvas({
        width: Math.round(selection.width * scale),
        height: Math.round(selection.height * scale),
      });

      return this.submitFile(await this.canvasToFile(canvas));
    } catch (e) {
      this.showError(e);
    }
  }

  /**
   * Encode a canvas to WebP, matching the format core stores avatars in.
   */
  async canvasToFile(canvas: HTMLCanvasElement, type = 'image/webp'): Promise<File> {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type));

    if (!blob) {
      throw new Error('Failed to encode the cropped image.');
    }

    const extension = (blob.type || type).split('/')[1];
    const name = this.attrs.file.name.replace(/\.[^.]+$/, '') + '.' + extension;

    return new File([blob], name, { type: blob.type || type });
  }

  async submitFile(file: File) {
    try {
      await this.attrs.upload(file);
    } catch (e) {
      this.showError(e);
    }
  }

  protected showError(error: unknown) {
    this.loaded();

    this.alertAttrs = {
      type: 'error',
      content: (error as Error)?.message || String(error),
    };

    m.redraw();
  }
}
