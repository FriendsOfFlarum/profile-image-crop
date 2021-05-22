import app from 'flarum/forum/app';

import { extend, override } from 'flarum/common/extend';
import AvatarEditor from 'flarum/forum/components/AvatarEditor';

import ProfileImageCropModal from './components/ProfileImageCropModal';

app.initializers.add('fof/profile-image-crop', () => {
    override(AvatarEditor.prototype, 'upload', function (original, file) {
        if (!file || !window.FileReader) return original();
        if (this.loading) return;

        app.modal.show(ProfileImageCropModal, {
            file,
            upload: original,
        });
    });

    extend(AvatarEditor.prototype, 'success', () => {
        app.modal.close();
    });

    extend(AvatarEditor.prototype, 'failure', (ignored, error) => {
        if (app.modal && app.modal.modal && app.modal.modal.componentClass === ProfileImageCropModal) {
            app.modal.modal.attrs.error = error;
            m.redraw();
        }
    });
});

export const components = {
    ProfileImageCropModal,
};
