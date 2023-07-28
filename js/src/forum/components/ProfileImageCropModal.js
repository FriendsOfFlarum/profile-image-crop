import app from 'flarum/forum/app';

import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

import { dataURLToBlob } from 'blob-util';

export default class ProfileImageCropModal extends Modal {
  static isDismissible = false;

  className() {
    return 'FofProfileImageCropModal Modal--small';
  }

  title() {
    return app.translator.trans('core.forum.user.avatar_upload_button');
  }

  oninit(vnode) {
    super.oninit(vnode);

    const reader = new FileReader();

    reader.addEventListener('load', () => {
      this.image = reader.result;
      m.redraw();
    });

    reader.readAsDataURL(this.attrs.file);
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Image-container">
          {!this.ready && <LoadingIndicator size="tiny" />}
          {this.image && <img src={this.image} data-ready={!!this.ready} onload={this.loadPicker.bind(this)} />}
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
          <Button className="Button Button--primary" loading={this.loading} onclick={this.upload.bind(this)} disabled={!this.ready}>
            {app.translator.trans(`fof-profile-image-crop.forum.modal.${this.cropper ? 'submit_crop' : 'submit'}_button`)}
          </Button>

          <Button className="Button Button--icon Button--danger" icon="fas fa-times" onclick={this.hide.bind(this)} />
        </div>
      </div>
    );
  }

  async loadPicker(evt) {
    __webpack_public_path__ = `${app.forum.attribute('baseUrl')}/assets/extensions/fof-profile-image-crop/`;

    // Need to store event target before async and/or timeouts,
    // otherwise becomes null on Chrome
    const target = evt.target || evt.path[0];

    let Cropper;

    try {
      Cropper = (await import(/* webpackChunkName: 'modules' */ 'cropperjs')).default;
    } catch (e) {
      console.error('[fof/profile-image-crop] An error occurred while loading cropperjs.', e);

      this.alertAttrs = {
        type: 'error',
        content: app.translator.trans('fof-profile-image-crop.forum.modal.error.failed_to_load_cropper'),
      };
    }

    setTimeout(() => {
      this.ready = true;

      if (Cropper) {
        this.cropper = new Cropper(target, {
          aspectRatio: 1,
          viewMode: 1,
          guides: false,
          background: false,
          responsive: true,
        });
      }

      m.redraw();
    }, 500);
  }

  onbeforeupdate(vnode) {
    const err = vnode.attrs.error;

    if (err) {
      this.loading = false;

      if (!err.alert) {
        this.alertAttrs = {
          type: 'error',
          content: err.toLocaleString?.() || err,
        };
      } else {
        delete this.alertAttrs;
      }

      delete vnode.attrs.error;
      delete app.modal.modal.attrs.error;
    }

    super.onbeforeupdate(vnode);
  }

  disableResize() {
    this.noResize = true;
    m.redraw();
  }

  disableCrop() {
    this.cropper.destroy();
    this.cropper = null;
    m.redraw();
  }

  async upload() {
    if (this.loading) return;

    this.loading = true;

    if (!this.cropper) {
      return this.submitBlob(await dataURLToBlob(this.image));
    }

    const canvas = this.cropper.getCroppedCanvas();

    if (this.noResize) {
      return this.submitBlob(await this.canvasToBlob(canvas));
    }

    let imageBlobReduce;

    try {
      imageBlobReduce = (await import(/* webpackChunkName: 'modules' */ 'image-blob-reduce')).default;
    } catch (e) {
      console.error('[fof/profile-image-crop] An error occurred while loading image-blob-reduce.', e);

      this.noResize = true;

      return this.upload();
    }

    let resizedCanvas = canvas;

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve));

      resizedCanvas = await imageBlobReduce().toCanvas(blob, {
        max: 100,
      });
    } catch (e) {
      console.error('[fof/profile-image-crop] An error occurred while resizing the image', e);

      this.alertAttrs = {
        type: 'error',
        content:
          e.code === 'ERR_GET_IMAGE_DATA'
            ? app.translator.trans('fof-profile-image-crop.forum.modal.error.get_image_data')
            : app.translator.trans('fof-profile-image-crop.forum.modal.error.generic_resize'),
      };

      this.loaded();

      this.cropper.destroy();
      this.cropper = null;

      m.redraw();

      return;
    }

    return this.submitBlob(await this.canvasToBlob(resizedCanvas));
  }

  async canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve));
  }

  async submitBlob(blob) {
    const file = new File([blob], this.attrs.file.name, { type: this.attrs.file.type });

    return this.attrs.upload(file);
  }
}
