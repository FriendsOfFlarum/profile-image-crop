import { extend, override } from 'flarum/extend';
import AvatarEditor from 'flarum/components/AvatarEditor';

import ProfileImageCropModal from './components/ProfileImageCropModal';

app.initializers.add('fof/profile-image-crop', () => {
    override(AvatarEditor.prototype, 'upload', function(original, file) {
        if (!file || !window.FileReader) return original();
        if (this.loading) return;

        app.modal.show(
            new ProfileImageCropModal({
                file,
                upload: original,
            })
        );
    });

    extend(AvatarEditor.prototype, 'success', () => {
        if (app.modal && app.modal.component instanceof ProfileImageCropModal) app.modal.close();
    });

    extend(AvatarEditor.prototype, 'failure', (ignored, error) => {
        if (app.modal && app.modal.component instanceof ProfileImageCropModal) {
            app.modal.component.loading = false;
            app.modal.component.onerror(error);
        }
    });
});
