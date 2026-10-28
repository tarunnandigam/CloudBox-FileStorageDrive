const SPRING_API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
import { account } from '@/lib/appwrite';

let cachedJwt;
let cachedJwtExpiresAt = 0;
let jwtRequest;
const JWT_CACHE_TTL_MS = 4 * 60 * 1000;

export const authHeaders = async () => {
  if (cachedJwt && Date.now() < cachedJwtExpiresAt) {
    return {
      Authorization: 'Bearer ' + cachedJwt,
      'X-Appwrite-JWT': cachedJwt
    };
  }
  if (!jwtRequest) {
    jwtRequest = account.createJWT().then(({ jwt }) => {
      cachedJwt = jwt;
      cachedJwtExpiresAt = Date.now() + JWT_CACHE_TTL_MS;
      return jwt;
    }).finally(() => {
      jwtRequest = undefined;
    });
  }
  const jwt = await jwtRequest;
  return {
    Authorization: 'Bearer ' + jwt,
    'X-Appwrite-JWT': jwt
  };
};


export const uploadFilesToSpring = async (files, userId, folderPath) => {
  console.log('API: Starting upload to', `${SPRING_API_BASE}/files/upload`);
  console.log('API: UserId:', userId);
  console.log('API: Files:', Array.from(files).map((f) => f.name));

  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });
  formData.append('userId', userId);
  if (folderPath) {
    formData.append('folderPath', folderPath);
  }

  try {
    const response = await fetch(`${SPRING_API_BASE}/files/upload`, {
      method: 'POST',
      headers: await authHeaders(),
      body: formData
    });

    console.log('API: Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Upload error response:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API: Upload success:', result);
    return result;
  } catch (error) {
    console.error('API: Upload network error:', error);
    throw error;
  }
};

export const getFilesFromSpring = async (userId, folderPath) => {
  console.log('API: Fetching files for userId:', userId);

  try {
    let url = `${SPRING_API_BASE}/files/list?userId=${userId}`;
    if (folderPath) {
      url += `&folderPath=${encodeURIComponent(folderPath)}`;
    }

    const response = await fetch(url, { headers: await authHeaders() });

    console.log('API: Files response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Files error response:', errorText);
      throw new Error(`Failed to fetch files: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API: Files data received:', data);
    return {
      files: data.files || [],
      folders: data.folders || []
    };
  } catch (error) {
    console.error('API: Files network error:', error);
    throw error;
  }
};

export const downloadFileFromSpring = async (fileId, userId) => {
  const response = await fetch(`${SPRING_API_BASE}/files/download?s3Key=${encodeURIComponent(fileId)}&userId=${encodeURIComponent(userId)}`, {
    headers: await authHeaders()
  });

  if (!response.ok) {
    throw new Error('Download failed');
  }

  return response.blob();
};

export const deleteFileFromSpring = async (fileId, userId) => {
  const response = await fetch(`${SPRING_API_BASE}/files/file?s3Key=${encodeURIComponent(fileId)}&userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: await authHeaders()
  });

  if (!response.ok) {
    throw new Error('Delete failed');
  }

  return response.json();
};

export const createFolderInSpring = async (folderName, userId, parentFolderPath) => {
  console.log('API: Creating folder:', folderName, 'for user:', userId, 'in path:', parentFolderPath);

  const formData = new FormData();
  formData.append('folderName', folderName);
  formData.append('userId', userId);
  if (parentFolderPath) {
    formData.append('parentFolderPath', parentFolderPath);
  }

  try {
    const response = await fetch(`${SPRING_API_BASE}/files/folder`, {
      method: 'POST',
      headers: await authHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create folder: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API: Folder created:', result);
    return result;
  } catch (error) {
    console.error('API: Folder creation error:', error);
    throw error;
  }
};

export const deleteFolderFromSpring = async (folderPath, userId) => {
  console.log('API: Deleting folder', folderPath, 'for user', userId);
  console.log('API: Encoded folder path:', encodeURIComponent(folderPath));
  const url = `${SPRING_API_BASE}/files/folder?userId=${userId}&folderPath=${encodeURIComponent(folderPath)}`;
  console.log('API: Delete URL:', url);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: await authHeaders()
  });

  console.log('API: Delete response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API: Delete error:', errorText);
    throw new Error(`Delete folder failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('API: Delete successful:', result);
  return result;
};

export const getStorageUsage = async (userId) => {
  const response = await fetch(`${SPRING_API_BASE}/files/storage-usage?userId=${encodeURIComponent(userId)}`, {
    headers: await authHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to get storage usage');
  }

  return response.json();
};
