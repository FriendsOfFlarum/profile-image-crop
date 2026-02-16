import app from 'flarum/forum/app';

import AvatarEditor from 'flarum/forum/components/AvatarEditor';

interface AvatarUploadResponse {
  data?: {
    attributes?: {
      avatarUrl?: string;
    };
  };
}

/**
 * AvatarEditor that shows a crop modal before uploading.
 */
export default class ProfileImageCropAvatarEditor extends AvatarEditor {
  upload(file: File): void {
    if (!file || !window.FileReader) return super.upload(file);
    if (this.loading) return;

    const user = (this.attrs as { user: { id: () => string } }).user;

    app.modal.show(() => import('./ProfileImageCropModal'), {
      file,
      upload: (croppedFile: File) => {
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
          .then((response: unknown) => {
            const res = response as AvatarUploadResponse;
            const attrs = res?.data?.attributes;
            if (attrs?.avatarUrl) {
              attrs.avatarUrl += (attrs.avatarUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
            }
            this.success(response as object);
            app.modal.close();
          })
          .catch((error: unknown) => {
            this.failure(error as object);
            const modal = app.modal?.modal;
            if (modal?.attrs?.upload) {
              (modal.attrs as Record<string, unknown>).error = error;
              m.redraw();
            }
          });
      },
    });
  }
}
