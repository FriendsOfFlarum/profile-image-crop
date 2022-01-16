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
          {this.image && <img src={this.image} ready={!!this.ready} onload={this.loadPicker.bind(this)} />}
        </div>

        <br />

        <div className="Modal-buttons">
          <Button className="Button Button--primary" loading={this.loading} onclick={this.upload.bind(this)}>
            {app.translator.trans('core.lib.edit_user.submit_button')}
          </Button>

          <Button className="Button Button--icon Button--danger" icon="fas fa-times" onclick={this.hide.bind(this)} />
        </div>
      </div>
    );
  }

  async loadPicker(evt) {
    __webpack_public_path__ = `${app.forum.attribute('baseUrl')}/assets/extensions/fof-profile-image-crop/`;

    let Cropper;

    try {
      Cropper = (await import(/* webpackChunkName: 'modules' */ 'cropperjs')).default;
    } catch (e) {
      console.error('[fof/profile-image-crop] An error occurred while loading cropperjs.', e);
    }

    setTimeout(() => {
      this.ready = true;

      if (Cropper) {
        this.cropper = new Cropper(evt.target, {
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
    if (vnode.attrs.error) {
      this.loading = false;

      delete vnode.attrs.error;
      delete app.modal.modal.attrs.error;
    }

    super.onbeforeupdate(vnode);
  }

  async submit() {
    try {
      await this.upload();
    } catch (e) {
      this.loading = false;

      throw e;
    }
  }

  async upload() {
    if (this.loading) return;

    this.loading = true;

    if (!this.cropper) {
      return await this.submitDataURI(this.image);
    }

    let Jimp;

    const canvas = await this.cropper.getCroppedCanvas();
    const dataURI = canvas.toDataURL();

    try {
      Jimp = (await import(/* webpackChunkName: 'modules' */ 'jimp/es')).default;
    } catch (e) {
      console.error('[fof/profile-image-crop] An error occurred while loading jimp', e);

      return await this.submitDataURI(canvas.toDataURL());
    }

    const image = await Jimp.read(dataURI);

    image.resize(500, 500);

    await this.submitDataURI(await image.getBase64Async(Jimp.AUTO));
  }

  async submitDataURI(dataURI) {
    const blob = await dataURLToBlob(dataURI);

    const file = new File([blob], this.attrs.file.name, { type: this.attrs.file.type });

    this.attrs.upload(file);
  }
}
