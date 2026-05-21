export type BannerSize = '200x40' | '88x31';

export const bannerSizeToDimensions = (bannerSize: BannerSize): { banner_width: number; banner_height: number; } => {
  if(bannerSize === '200x40') return { banner_width: 200, banner_height: 40 };
  return { banner_width: 88, banner_height: 31 };
};
