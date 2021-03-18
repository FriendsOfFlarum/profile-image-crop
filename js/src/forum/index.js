import { extend, override } from 'flarum/common/extend';
import AvatarEditor from 'flarum/common/components/AvatarEditor';

import ProfileImageCropModal from './components/ProfileImageCropModal';

app.initializers.add('fof/profile-image-crop', () => {
    let cropModal;
    override(AvatarEditor.prototype, 'upload', function (original, file) {
        if (!file || !window.FileReader) return original();
        if (this.loading) return;

        cropModal = app.modal.show(ProfileImageCropModal, {
            file,
            upload: original,
        });
    });

    extend(AvatarEditor.prototype, 'success', () => {
        app.modal.close(cropModal);
    });

    extend(AvatarEditor.prototype, 'failure', (ignored, error) => {
        if (app.modal && app.modal.component instanceof ProfileImageCropModal) {
            app.modal.component.loading = false;
            app.modal.component.onerror(error);
        }
    });
});
