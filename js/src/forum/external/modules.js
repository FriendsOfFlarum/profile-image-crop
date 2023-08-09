import app from 'flarum/forum/app';

const prepare = () => (__webpack_public_path__ = `${app.forum.attribute('baseUrl')}/assets/extensions/fof-profile-image-crop/`);

export const loadCropper = async () => {
  try {
    prepare();

    return (await import(/* webpackChunkName: 'modules' */ 'cropperjs')).default;
  } catch (e) {
    console.error('[fof/profile-image-crop] An error occurred while loading `cropperjs`.', e);
  }

  return null;
};

export const loadImageBlobReduce = async () => {
  try {
    prepare();

    return (await import(/* webpackChunkName: 'modules' */ 'image-blob-reduce')).default;
  } catch (e) {
    console.error('[fof/profile-image-crop] An error occurred while loading `image-blob-reduce`.', e);
  }

  return null;
};
