import { BACKEND_URL } from '@/config/constants';

export async function uploadProfileImage(
  token: string,
  file: File
): Promise<{ ok: boolean; image?: string; message?: string }> {
  const formData = new FormData();
  formData.append('image', file);
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/upload-image`, {
      method: 'POST',
      headers: { token },
      body: formData,
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { ok: true, image: data.user.image };
    }
    return { ok: false, message: data.message };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}