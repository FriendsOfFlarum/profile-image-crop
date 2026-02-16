import app from 'flarum/forum/app';

import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

import Cropper from 'cropperjs';

export default class ProfileImageCropModal extends Modal {
  static isDismissibleViaCloseButton = true;
  static isDismissibleViaEscKey = false;
  static isDismissibleViaBackdropClick = false;

  image!: string | ArrayBuffer | null;
  ready = false;
  loading = false;
  noResize = false;
  cropper: InstanceType<typeof Cropper> | null = null;

  className() {
    return 'FofProfileImageCropModal Modal--small';
  }

  title() {
    return app.translator.trans('core.forum.user.avatar_upload_button');
  }

  oninit(vnode: any) {
    super.oninit(vnode);

    const reader = new FileReader();

    reader.addEventListener('load', () => {
      this.image = reader.result;
      m.redraw();
    });

    reader.readAsDataURL((this.attrs as unknown as { file: File }).file);
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Image-container">
          {!this.ready && <LoadingIndicator size="tiny" />}
          {this.image && <img src={this.image as string} data-ready={!!this.ready} onload={this.loadPicker.bind(this)} />}
        </div>

        <br />

        {this.ready && this.cropper && (
          <p className="helpText">
            {app.translator.trans('fof-profile-image-crop.forum.modal.help_text', {
              disableResize: this.noResize ? <s /> : <a onclick={this.disableResize.bind(this)} />,
              disableCrop: !this.cropper ? <s /> : <a onclick={this.disableCrop.bind(this)} />,
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
            disabled={!this.ready}
          >
            {app.translator.trans(`fof-profile-image-crop.forum.modal.${this.cropper ? 'submit_crop' : 'submit'}_button`)}
          </Button>

          <Button className="Button Button--icon Button--danger" icon="fas fa-times" onclick={this.hide.bind(this)} />
        </div>
      </div>
    );
  }

  loadPicker(evt: Event) {
    // Need to store event target before async and/or timeouts,
    // otherwise becomes null on Chrome
    const target = (evt.target || (evt as Event & { path?: EventTarget[] }).path?.[0]) as HTMLImageElement;

    setTimeout(() => {
      this.ready = true;

      this.cropper = new Cropper(target, {
        container: target.parentElement!,
      });
      const selection = this.cropper.getCropperSelection();
      if (selection) {
        selection.aspectRatio = 1;
        selection.movable = true;
        selection.resizable = true;
      }

      m.redraw();
    }, 500);
  }

  onbeforeupdate(vnode: any) {
    const err = vnode.attrs.error;

    if (err) {
      this.loading = false;

      if (!(err as { alert?: boolean }).alert) {
        this.alertAttrs = {
          type: 'error',
          content: (err as Error).toLocaleString?.() || String(err),
        } as any;
      } else {
        this.alertAttrs = null;
      }

      if ('error' in vnode.attrs) delete (vnode.attrs as Record<string, unknown>).error;
      if (app.modal?.modal?.attrs && 'error' in app.modal.modal.attrs) delete (app.modal.modal.attrs as Record<string, unknown>).error;
    }

    super.onbeforeupdate(vnode);
  }

  disableResize() {
    this.noResize = true;
    m.redraw();
  }

  disableCrop() {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    m.redraw();
  }

  async upload(): Promise<void> {
    if (this.loading) return;

    this.loading = true;

    if (!this.cropper) {
      const blob = await fetch(this.image as string).then((r) => r.blob());
      return this.submitBlob(blob);
    }

    const selection = this.cropper.getCropperSelection();
    const canvas = selection ? await selection.$toCanvas() : null;

    if (!canvas) {
      this.loaded();
      return;
    }

    if (this.noResize) {
      return this.submitBlob(await this.canvasToBlob(canvas));
    }

    try {
      const resizedCanvas = this.resizeCanvas(canvas, 100);
      return this.submitBlob(await this.canvasToBlob(resizedCanvas));
    } catch (e) {
      console.error('[fof/profile-image-crop] An error occurred while resizing the image.', e);
      this.loaded();
      this.disableResize();
      return this.upload();
    }
  }

  resizeCanvas(canvas: HTMLCanvasElement, maxSize: number): HTMLCanvasElement {
    const { width, height } = canvas;
    const scale = Math.min(maxSize / width, maxSize / height, 1);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    const resized = document.createElement('canvas');
    resized.width = newWidth;
    resized.height = newHeight;
    resized.getContext('2d')!.drawImage(canvas, 0, 0, newWidth, newHeight);
    return resized;
  }

  async canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), type));
  }

  async submitBlob(blob: Blob) {
    const type = blob.type || 'image/png';
    const attrs = this.attrs as unknown as { file: File; upload?: (file: File) => Promise<void> };
    if (!attrs.upload) {
      console.error('[fof/profile-image-crop] Upload callback not found in modal attrs');
      this.loaded();
      return;
    }
    const file = new File([blob], attrs.file.name.replace(/\.[^.]+$/, '.png'), { type });

    try {
      await attrs.upload(file);
      this.loaded();
    } catch (e) {
      this.loaded();
      this.alertAttrs = {
        type: 'error',
        content: (e as Error)?.message || String(e),
      } as any;
      m.redraw();
    }
  }
}
