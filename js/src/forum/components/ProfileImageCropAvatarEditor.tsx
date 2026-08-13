import app from 'flarum/forum/app';

import AvatarEditor from 'flarum/forum/components/AvatarEditor';

import { ANIMATED_TYPES } from '../utils/animatedTypes';

import type User from 'flarum/common/models/User';

/**
 * An `AvatarEditor` that shows a crop modal before handing the resulting file
 * back to core's upload flow.
 */
export default class ProfileImageCropAvatarEditor extends AvatarEditor {
  upload(file: File): void {
    if (!file || !window.FileReader || ANIMATED_TYPES.includes(file.type)) return super.upload(file);
    if (this.loading) return;

    app.modal.show(() => import('./ProfileImageCropModal'), {
      file,
      upload: (croppedFile: File) => {
        // Core's `upload()` fires the request but doesn't hand back a promise,
        // so we mirror its request here to know when the upload settles —
        // reusing its `success`/`failure` handlers to keep the store in sync.
        const user = (this.attrs as { user: User }).user;
        const data = new FormData();
        data.append('avatar', croppedFile);

        this.loading = true;
        m.redraw();

        return app
          .request({
            method: 'POST',
            url: `${app.forum.attribute('apiUrl')}/users/${user.id()}/avatar`,
            serialize: (raw: unknown) => raw,
            body: data,
          })
          .then((response) => {
            this.success(response as object);
            app.modal.close();
          })
          .catch((error) => {
            this.failure(error);

            // Rethrow so the modal surfaces the error and stays open.
            throw error;
          });
      },
    });
  }
}
