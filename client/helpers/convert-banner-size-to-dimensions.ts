export type BannerSize = '200x40' | '88x31';

export const convertBannerSizeToDimensions = (bannerSize: BannerSize): { bannerWidth: number; bannerHeight: number; } => {
  if(bannerSize === '200x40') return { bannerWidth: 200, bannerHeight: 40 };
  return { bannerWidth: 88, bannerHeight: 31 };
};
