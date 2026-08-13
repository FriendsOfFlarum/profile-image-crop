import AvatarEditor from 'flarum/forum/components/AvatarEditor';
/**
 * An `AvatarEditor` that shows a crop modal before handing the resulting file
 * back to core's upload flow.
 */
export default class ProfileImageCropAvatarEditor extends AvatarEditor {
    upload(file: File): void;
}
