import app from 'flarum/forum/app';

import { extend } from 'flarum/common/extend';
import AvatarEditor from 'flarum/forum/components/AvatarEditor';
import UserCard from 'flarum/forum/components/UserCard';

import ProfileImageCropAvatarEditor from './components/ProfileImageCropAvatarEditor';

app.initializers.add('fof/profile-image-crop', () => {
  extend(UserCard.prototype, 'avatar', function (avatarOutput) {
    if (avatarOutput?.tag === AvatarEditor) {
      (avatarOutput as any).tag = ProfileImageCropAvatarEditor;
    }
  });
});
