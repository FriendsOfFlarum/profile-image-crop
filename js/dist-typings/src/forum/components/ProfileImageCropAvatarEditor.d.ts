import AvatarEditor from 'flarum/forum/components/AvatarEditor';
/**
 * AvatarEditor that shows a crop modal before uploading.
 */
export default class ProfileImageCropAvatarEditor extends AvatarEditor {
    upload(file: File): void;
}
