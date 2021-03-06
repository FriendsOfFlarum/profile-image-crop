import app from 'flarum/forum/app';

import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

import Cropper from 'cropperjs';

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
                    {this.image && <img src={this.image} ready={!!this.ready} oncreate={this.loadPicker.bind(this)} />}
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

    loadPicker(vnode) {
        setTimeout(() => {
            this.ready = true;

            this.cropper = new Cropper(vnode.dom, {
                aspectRatio: 1,
                viewMode: 1,
                guides: false,
                background: false,
                responsive: true,
            });

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

    async upload() {
        if (!this.cropper) return;

        this.loading = true;

        const canvas = this.cropper.getCroppedCanvas();
        let blob;

        if (canvas.toBlob) {
            await new Promise((r) => canvas.toBlob(r)).then((b) => (blob = b));
        } else {
            const dataURI = canvas && canvas.toDataURL(this.attrs.file.type);

            const arr = dataURI.split(',');
            const bstr = atob(arr[1]);
            let n = bstr.length,
                u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);

            blob = u8arr;
        }

        const file = new File([blob], this.attrs.file.name, { type: this.attrs.file.type });

        this.attrs.upload(file);
    }
}
