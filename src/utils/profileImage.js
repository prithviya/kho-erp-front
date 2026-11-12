const API_ROOT_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export function getProfileImageUrl(profileImage) {
  const imagePath = String(profileImage || '').trim();
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${API_ROOT_URL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
}
