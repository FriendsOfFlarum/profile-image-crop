import Modal from 'flarum/components/Modal';
import Button from 'flarum/components/Button';
import LoadingIndicator from 'flarum/components/LoadingIndicator';

import Cropper from 'cropperjs';

export default class ProfileImageCropModal extends Modal {
    className() {
        return 'FofProfileImageCropModal Modal--small';
    }

    title() {
        return app.translator.trans('core.forum.user.avatar_upload_button');
    }

    config(isInitialized) {
        if (isInitialized) return;

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
                    {console.log('content')}
                    {!this.ready && LoadingIndicator.component({ size: 'tiny' })}
                    {this.image && <img src={this.image} config={this.loadPicker.bind(this)} />}
                </div>

                <br />

                {Button.component({
                    className: 'Button Button--primary',
                    loading: this.loading,
                    onclick: this.upload.bind(this),
                }, app.translator.trans('core.forum.edit_user.submit_button'))}
            </div>
        );
    }

    loadPicker($el, isInitialized) {
        console.log('here');
        if (isInitialized) return;

        setTimeout(() => {
            this.ready = true;

            this.cropper = new Cropper($el, {
                aspectRatio: 1,
                viewMode: 1,
                guides: false,
                background: false,
                responsive: true,
            });

            m.redraw();
        }, 500);
    }

    async upload() {
        console.log('1');
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

        this.props.upload(file);
    }
}
