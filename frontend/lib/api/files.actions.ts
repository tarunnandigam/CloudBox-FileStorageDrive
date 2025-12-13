const SPRING_API_BASE = 'http://localhost:8080/api';

export interface FileResponse {
  id: number;
  name: string;
  size: string;
  modified: string;
  type: string;
}

export const uploadFilesToSpring = async (files: FileList | File[], userId: string) => {
  console.log('API: Starting upload to', `${SPRING_API_BASE}/files/upload`);
  console.log('API: UserId:', userId);
  console.log('API: Files:', Array.from(files).map(f => f.name));
  
  const formData = new FormData();
  
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });
  formData.append('userId', userId);

  try {
    const response = await fetch(`${SPRING_API_BASE}/files/upload`, {
      method: 'POST',
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

export const getFilesFromSpring = async (userId: string): Promise<FileResponse[]> => {
  console.log('API: Fetching files for userId:', userId);
  
  try {
    const response = await fetch(`${SPRING_API_BASE}/files/list?userId=${userId}`);
    
    console.log('API: Files response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Files error response:', errorText);
      throw new Error(`Failed to fetch files: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API: Files data received:', data);
    return data.files || [];
  } catch (error) {
    console.error('API: Files network error:', error);
    throw error;
  }
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