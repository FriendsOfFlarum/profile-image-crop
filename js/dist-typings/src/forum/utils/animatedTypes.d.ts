/**
 * Image types that may contain animation.
 *
 * These are uploaded as-is rather than cropped: drawing them onto a canvas
 * would flatten them to a single frame, whereas core preserves the animation
 * by encoding to GIF instead of WebP.
 */
export declare const ANIMATED_TYPES: string[];
