const SPRING_API_BASE = 'http://localhost:8080/api';

export interface FileResponse {
  id: number;
  name: string;
  size: string;
  modified: string;
  type: string;
}

export const uploadFilesToSpring = async (files: FileList | File[], userId: string) => {
  const formData = new FormData();
  
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });
  formData.append('userId', userId);

  const response = await fetch(`${SPRING_API_BASE}/files/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
};

export const getFilesFromSpring = async (userId: string): Promise<FileResponse[]> => {
  const response = await fetch(`${SPRING_API_BASE}/files/list?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }

  const data = await response.json();
  return data.files || [];
};

export const downloadFileFromSpring = async (fileId: number, userId: string) => {
  const response = await fetch(`${SPRING_API_BASE}/files/download/${fileId}?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error('Download failed');
  }

  return response.blob();
};

export const deleteFileFromSpring = async (fileId: number, userId: string) => {
  const response = await fetch(`${SPRING_API_BASE}/files/${fileId}?userId=${userId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Delete failed');
  }

  return response.json();
};