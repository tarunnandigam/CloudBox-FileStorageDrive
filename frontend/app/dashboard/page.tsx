"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  FolderPlus, 
  File, 
  Folder,
  MoreVertical,
  Download,
  Trash2,
  LogOut,
  HardDrive,
  FileText,
  Clock,
  Heart,
  ShoppingCart,
  Share2,
  Edit3,
  ArrowLeft
} from "lucide-react";
import { logOut } from "@/lib/auth/auth.actions";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user.context";
import { uploadFilesToSpring, getFilesFromSpring, deleteFileFromSpring, downloadFileFromSpring, createFolderInSpring, deleteFolderFromSpring, getStorageUsage, FileResponse, FolderResponse } from "@/lib/api/files.actions";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [folders, setFolders] = useState<FolderResponse[]>([]);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{fullPath: string, name: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<"mydrive" | "shared" | "favourite" | "trash">("mydrive");
  const [favoriteFiles, setFavoriteFiles] = useState<Set<number>>(new Set());


  const [trashedFiles, setTrashedFiles] = useState<FileResponse[]>([]);
  const [trashedFolders, setTrashedFolders] = useState<FolderResponse[]>([]);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{id: number, type: 'file' | 'folder', name: string} | null>(null);

  const [notifications, setNotifications] = useState<Array<{id: number, message: string, type: 'success' | 'error' | 'info'}>>([]);
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("monthly");
  const [storageUsage, setStorageUsage] = useState({ usedMB: 0, maxMB: 1024, percentage: 0, availableMB: 1024 });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };
  const router = useRouter();
  const { current: user, signout, loading: userLoading } = useUser();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth");
    }
  }, [router, user, userLoading]);

  const userEmail = user?.email || "user@example.com";
  const userName = user?.name || userEmail.split("@")[0];

  const getSectionTitle = () => {
    switch (activeSection) {
      case "mydrive": return "My Drive";
      case "shared": return "Shared with me";
      case "favourite": return "Favourite";
      case "trash": return "Trash";
      default: return "My Drive";
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getGroupedRecentItems = () => {
    const recentFiles = (files || []).slice(0, 8).filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(file => ({...file, type: 'file'}));
    
    const grouped = recentFiles.reduce((acc, item) => {
      const relativeDate = getRelativeDate(item.modified);
      if (!acc[relativeDate]) {
        acc[relativeDate] = [];
      }
      acc[relativeDate].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    return grouped;
  };

  const getFilteredFiles = () => {
    let filteredFiles;
    
    if (activeSection === "trash") {
      filteredFiles = (trashedFiles || []).filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      filteredFiles = (files || []).filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (activeSection === "favourite") {
        filteredFiles = filteredFiles.filter(file => favoriteFiles.has(file.id));
      }
    }
    
    return filteredFiles;
  };

  const getFilteredFolders = () => {
    let filteredFolders;
    
    if (activeSection === "trash") {
      filteredFolders = (trashedFolders || []).filter(folder => 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      filteredFolders = (folders || []).filter(folder => 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filteredFolders;
  };

  const toggleFavorite = (fileId: number) => {
    const file = files.find(f => f.id === fileId) || trashedFiles.find(f => f.id === fileId);
    const isCurrentlyFavorite = favoriteFiles.has(fileId);
    
    setFavoriteFiles(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(fileId)) {
        newFavorites.delete(fileId);
      } else {
        newFavorites.add(fileId);
      }
      return newFavorites;
    });
    
    if (file) {
      if (isCurrentlyFavorite) {
        showNotification(`"${file.name}" removed from favorites`);
      } else {
        showNotification(`"${file.name}" added to favorites`);
      }
    }
  };







  const moveFileToTrash = (fileId: number) => {
    const fileToTrash = files.find(file => file.id === fileId);
    if (fileToTrash) {
      setTrashedFiles(prev => [...prev, fileToTrash]);
      setFiles(prev => prev.filter(file => file.id !== fileId));
      showNotification(`"${fileToTrash.name}" moved to trash`);
    }
  };

  const moveFolderToTrash = (folderId: number) => {
    const folderToTrash = folders.find(folder => folder.id === folderId);
    if (folderToTrash) {
      setTrashedFolders(prev => [...prev, folderToTrash]);
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      showNotification(`Folder "${folderToTrash.name}" moved to trash`);
    }
  };

  const restoreFile = (fileId: number) => {
    const fileToRestore = trashedFiles.find(file => file.id === fileId);
    if (fileToRestore) {
      setFiles(prev => [...prev, fileToRestore]);
      setTrashedFiles(prev => prev.filter(file => file.id !== fileId));
      showNotification(`"${fileToRestore.name}" restored successfully`);
    }
  };

  const restoreFolder = (folderId: number) => {
    const folderToRestore = trashedFolders.find(folder => folder.id === folderId);
    if (folderToRestore) {
      setFolders(prev => [...prev, folderToRestore]);
      setTrashedFolders(prev => prev.filter(folder => folder.id !== folderId));
      showNotification(`Folder "${folderToRestore.name}" restored successfully`);
    }
  };

  const permanentlyDeleteFile = (fileId: number) => {
    setTrashedFiles(prev => prev.filter(file => file.id !== fileId));
    setFavoriteFiles(prev => {
      const newFavorites = new Set(prev);
      newFavorites.delete(fileId);
      return newFavorites;
    });
  };

  const permanentlyDeleteFolder = (folderId: number) => {
    setTrashedFolders(prev => prev.filter(folder => folder.id !== folderId));
  };

  const handleDeleteFile = async (file: FileResponse) => {
    if (!user?.email) return;
    
    try {
      // Use the file's S3 key for deletion
      const response = await fetch(`http://localhost:8080/api/files/file?s3Key=${encodeURIComponent(file.key)}&userId=${user.email}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      await loadFiles();
      showNotification(`"${file.name}" deleted successfully`);
    } catch (error) {
      console.error('Delete file failed:', error);
      showNotification('Failed to delete file', 'error');
    }
  };





  const createFolder = async () => {
    if (newFolderName.trim() && user?.email) {
      try {
        await createFolderInSpring(newFolderName.trim(), user.email, currentFolderPath);
        await loadFiles();
        showNotification(`Folder "${newFolderName.trim()}" created successfully`);
        setNewFolderName("");
        setShowCreateFolderDialog(false);
      } catch (error) {
        console.error('Failed to create folder:', error);
        showNotification('Failed to create folder', 'error');
      }
    }
  };

  const handleFolderClick = (folder: FolderResponse) => {
    setCurrentFolderPath(folder.fullPath);
  };

  const handleDeleteFolder = (folderPath: string, folderName: string) => {
    setFolderToDelete({fullPath: folderPath, name: folderName});
    setShowDeleteFolderDialog(true);
  };

  const confirmDeleteFolder = async () => {
    if (!user?.email || !folderToDelete) return;
    
    try {
      await deleteFolderFromSpring(folderToDelete.fullPath, user.email);
      await loadFiles();
      showNotification(`Folder "${folderToDelete.name}" deleted successfully`);
    } catch (error) {
      console.error('Delete folder failed:', error);
      showNotification('Failed to delete folder', 'error');
    } finally {
      setShowDeleteFolderDialog(false);
      setFolderToDelete(null);
    }
  };

  const clearAll = async () => {
    if (!user?.email) return;
    
    if (confirm('Are you sure you want to delete ALL files and folders? This cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:8080/api/files/clear-all?userId=${user.email}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear all');
        }
        
        await loadFiles();
        showNotification('All files and folders cleared successfully');
      } catch (error) {
        console.error('Clear all failed:', error);
        showNotification('Failed to clear all', 'error');
      }
    }
  };

  const confirmPermanentDelete = () => {
    if (deleteItem) {
      if (deleteItem.type === 'file') {
        permanentlyDeleteFile(deleteItem.id);
        showNotification(`"${deleteItem.name}" permanently deleted`);
      } else {
        permanentlyDeleteFolder(deleteItem.id);
        showNotification(`Folder "${deleteItem.name}" permanently deleted`);
      }
      setDeleteItem(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    await signout();
    await logOut();
    router.push("/auth");
  };

  const handleFileUpload = async (uploadedFiles: FileList | File[]) => {
    if (!user?.email) {
      console.error('No user email found');
      return;
    }
    
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    
    try {
      const result = await uploadFilesToSpring(uploadedFiles, user.email, currentFolderPath);
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(async () => {
        await loadFiles();
        setIsUploading(false);
        setUploadProgress(0);
        
        const fileCount = Array.from(uploadedFiles).length;
        if (fileCount === 1) {
          showNotification(`File uploaded successfully`);
        } else {
          showNotification(`${fileCount} files uploaded successfully`);
        }
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      showNotification('Upload failed: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!user?.email) {
      console.error('No user email for loading files');
      return;
    }
    
    try {
      const result = await getFilesFromSpring(user.email, currentFolderPath);
      setFiles(result.files);
      setFolders(result.folders);
      
      // Load storage usage
      const usage = await getStorageUsage(user.email);
      if (usage.success) {
        setStorageUsage({
          usedMB: usage.usedMB,
          maxMB: usage.maxMB,
          percentage: usage.percentage,
          availableMB: usage.availableMB
        });
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };



  const handleDownloadFile = async (fileId: number, fileName: string) => {
    if (!user?.email) return;
    
    try {
      const blob = await downloadFileFromSpring(fileId, user.email);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFileUpload(target.files);
      }
    };
    input.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  };

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadFiles();
    }
  }, [user?.email, currentFolderPath]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden text-white hover:bg-[hsl(var(--primary))] hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <List className="w-4 h-4" />
            </Button>
            <Image
              src="/cloudboxpinklogo.png"
              alt="CloudBox"
              width={32}
              height={32}
            />
            <h1 className="text-lg md:text-xl font-bold">CloudBox File Storage</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:block text-sm text-gray-300">Welcome, {userName}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-[hsl(var(--primary))] hover:text-white">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="border-b border-gray-800 px-4 py-2">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">Uploading files...</span>
              <span className="text-sm text-gray-300">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Toolbar */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white flex-1 sm:flex-none" onClick={handleUploadClick} disabled={isUploading}>
              <Upload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Upload'}</span>
            </Button>
            <Button variant="outline" className="border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white flex-1 sm:flex-none" onClick={() => setShowCreateFolderDialog(true)}>
              <FolderPlus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Folder</span>
            </Button>
            <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex-1 sm:flex-none" onClick={clearAll}>
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          </div>
          
          <div className="flex-1 w-full sm:max-w-md lg:max-w-lg xl:max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-gray-900 border-gray-700"
              />
            </div>
          </div>
          
          <div className="flex border border-gray-700 rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`rounded-r-none ${viewMode === "grid" ? "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/.9)]" : "text-white hover:bg-[hsl(var(--primary))] hover:text-white"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-l-none ${viewMode === "list" ? "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/.9)]" : "text-white hover:bg-[hsl(var(--primary))] hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 md:z-auto w-64 h-full md:h-auto border-r border-gray-800 p-4 bg-black transition-transform duration-300 ease-in-out`}>
          <nav className="space-y-2">

            <Button 
              variant="ghost" 
              onClick={() => { setActiveSection("mydrive"); loadFiles(); }}
              className={`w-full justify-start ${activeSection === "mydrive" ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10" : "text-white"} hover:bg-[hsl(var(--primary))] hover:text-white`}
            >
              <HardDrive className="w-4 h-4 mr-3" />
              My Drive
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection("shared")}
              className={`w-full justify-start ${activeSection === "shared" ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10" : "text-white"} hover:bg-[hsl(var(--primary))] hover:text-white`}
            >
              <Share2 className="w-4 h-4 mr-3" />
              Shared with me
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection("favourite")}
              className={`w-full justify-start ${activeSection === "favourite" ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10" : "text-white"} hover:bg-[hsl(var(--primary))] hover:text-white`}
            >
              <Heart className="w-4 h-4 mr-3" />
              Favourite
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection("trash")}
              className={`w-full justify-start ${activeSection === "trash" ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10" : "text-white"} hover:bg-[hsl(var(--primary))] hover:text-white`}
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Trash
            </Button>
          </nav>
          
          {/* Storage Section */}
          <div className="mt-6 md:mt-8 space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <HardDrive className="w-4 h-4 mr-2" />
                Storage
              </h3>
              <p className="text-xs text-gray-400 mb-2">{storageUsage.usedMB} MB of {storageUsage.maxMB} MB used</p>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}></div>
              </div>
              
              <p className="text-xs text-gray-400 mb-4">{storageUsage.percentage}% Full • {storageUsage.availableMB} MB available</p>
              
              <Button size="sm" className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white" onClick={() => setShowStorageDialog(true)}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Get Storage
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div 
          className={`flex-1 p-4 md:p-6 ${isDragging ? 'bg-gray-900/50 border-2 border-dashed border-[hsl(var(--primary))]' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag Overlay */}
          {isDragging && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-[hsl(var(--primary))] text-white p-6 md:p-8 rounded-lg text-center mx-4">
                <Upload className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-bold mb-2">Drop files here</h3>
                <p className="text-sm md:text-base">Release to upload your files</p>
              </div>
            </div>
          )}



          {/* My Drive Section */}
          {activeSection === "mydrive" && (
            <div className="space-y-6">
              {/* Breadcrumb Navigation */}
              {currentFolderPath && (
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentFolderPath("")} className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <span className="text-gray-400">/{currentFolderPath}</span>
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-white">
                {currentFolderPath ? `${currentFolderPath.split('/').pop()} Folder` : 'My Drive'}
              </h2>
              
              {/* Folders Section */}
              {folders && folders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Folders</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {folders.map((folder) => (
                      <Card key={folder.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3" onClick={() => handleFolderClick(folder)}>
                              <Folder className="w-8 h-8 text-yellow-400" />
                              <div>
                                <h4 className="font-medium text-sm text-white truncate" title={folder.name}>
                                  {folder.name.length > 20 ? `${folder.name.substring(0, 20)}...` : folder.name}
                                </h4>
                                <p className="text-xs text-gray-500">{formatTimestamp(folder.modified)}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700" 
                              title="Delete Folder"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.fullPath, folder.name);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              

              
              {/* Files Section */}
              {getFilteredFiles().length === 0 && getFilteredFolders().length === 0 ? (
                <div className="text-center py-16">
                  <File className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  {searchQuery ? (
                    <>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">No files found</h3>
                      <p className="text-gray-500">Try searching with different keywords</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">No files or folders</h3>
                      <p className="text-gray-500 mb-6">Upload files or create folders to get started</p>
                      <div className="flex gap-3 justify-center">
                        <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white" onClick={handleUploadClick}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </Button>
                        <Button variant="outline" className="border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white" onClick={() => setShowCreateFolderDialog(true)}>
                          <FolderPlus className="w-4 h-4 mr-2" />
                          New Folder
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {getFilteredFiles().length > 0 && <h3 className="text-lg font-semibold text-white mb-4">Files</h3>}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {getFilteredFiles().map((file) => (
                        <Card key={file.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <File className="w-8 h-8 text-blue-400" />
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 hover:bg-gray-700" title="Share">
                                  <Share2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 hover:bg-gray-700 ${favoriteFiles.has(file.id) ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} title="Favorite" onClick={() => toggleFavorite(file.id)}>
                                  <Heart className={`w-3 h-3 ${favoriteFiles.has(file.id) ? 'fill-current' : ''}`} />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700" title="Download" onClick={() => handleDownloadFile(file.id, file.name)}>
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700" title="Delete File" onClick={() => handleDeleteFile(file)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <h4 className="font-medium text-sm mb-1" title={file.name}>
                              {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                            </h4>
                            <p className="text-xs text-gray-400">{file.size}</p>
                            <p className="text-xs text-gray-500">{formatTimestamp(file.modified)}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredFiles().map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="w-6 h-6 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm text-white truncate" title={file.name}>{file.name}</h4>
                              <p className="text-xs text-gray-400">{file.size} • {formatTimestamp(file.modified)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400" title="Share">
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${favoriteFiles.has(file.id) ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} title="Favorite" onClick={() => toggleFavorite(file.id)}>
                              <Heart className={`w-4 h-4 ${favoriteFiles.has(file.id) ? 'fill-current' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-green-400" title="Download" onClick={() => handleDownloadFile(file.id, file.name)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-400" title="Delete File" onClick={() => handleDeleteFile(file)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Favourite Section */}
          {activeSection === "favourite" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Favourite Files</h2>
              
              {getFilteredFiles().length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  {searchQuery ? (
                    <>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">No favourite files found</h3>
                      <p className="text-gray-500">Try searching with different keywords</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">No favourite files</h3>
                      <p className="text-gray-500">Mark files as favourite to see them here</p>
                    </>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {getFilteredFiles().map((file) => (
                    <Card key={file.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <File className="w-8 h-8 text-blue-400" />
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 hover:bg-gray-700" title="Share">
                              <Share2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-yellow-400 hover:bg-gray-700" title="Remove from Favorites" onClick={() => toggleFavorite(file.id)}>
                              <Heart className="w-3 h-3 fill-current" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700" title="Download" onClick={() => handleDownloadFile(file.id, file.name)}>
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-medium text-sm mb-1" title={file.name}>
                          {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                        </h4>
                        <p className="text-xs text-gray-400">{file.size}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(file.modified)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredFiles().map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm text-white truncate" title={file.name}>{file.name}</h4>
                          <p className="text-xs text-gray-400">{file.size} • {formatTimestamp(file.modified)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400" title="Share">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-yellow-400" title="Remove from Favorites" onClick={() => toggleFavorite(file.id)}>
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-green-400" title="Download" onClick={() => handleDownloadFile(file.id, file.name)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trash Section */}
          {activeSection === "trash" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Trash</h2>
              
              {/* Trashed Folders */}
              {getFilteredFolders().length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Folders</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {getFilteredFolders().map((folder) => (
                      <Card key={folder.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer relative">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Folder className="w-8 h-8 text-yellow-400" />
                              <div>
                                <h4 className="font-medium text-sm text-white truncate" title={folder.name}>
                                  {folder.name.length > 20 ? `${folder.name.substring(0, 20)}...` : folder.name}
                                </h4>
                                <p className="text-xs text-gray-500">{formatTimestamp(folder.modified)}</p>
                              </div>
                            </div>
                            <div className="relative">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === folder.id ? null : folder.id); }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              {openDropdown === folder.id && (
                                <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                                  <div className="py-1">
                                    <button 
                                      className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2"
                                      onClick={() => { restoreFolder(folder.id); setOpenDropdown(null); }}
                                    >
                                      <Upload className="w-4 h-4" />
                                      Restore
                                    </button>
                                    <button 
                                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                                      onClick={() => { permanentlyDeleteFolder(folder.id); setOpenDropdown(null); }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete Permanently
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trashed Files */}
              {getFilteredFiles().length === 0 && getFilteredFolders().length === 0 ? (
                <div className="text-center py-16">
                  <Trash2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  {searchQuery ? (
                    <>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">No items found in trash</h3>
                      <p className="text-gray-500">Try searching with different keywords</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">Trash is empty</h3>
                      <p className="text-gray-500">Items you delete will appear here</p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {getFilteredFiles().length > 0 && <h3 className="text-lg font-semibold text-white mb-4">Files</h3>}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {getFilteredFiles().map((file) => (
                        <Card key={file.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <File className="w-8 h-8 text-blue-400" />
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700" title="Restore" onClick={() => restoreFile(file.id)}>
                                  <Upload className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700" title="Delete Permanently" onClick={() => handleDeleteFile(file)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <h4 className="font-medium text-sm mb-1" title={file.name}>
                              {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                            </h4>
                            <p className="text-xs text-gray-400">{file.size}</p>
                            <p className="text-xs text-gray-500">{formatTimestamp(file.modified)}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredFiles().map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="w-6 h-6 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm text-white truncate" title={file.name}>{file.name}</h4>
                              <p className="text-xs text-gray-400">{file.size} • {formatTimestamp(file.modified)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-green-400" title="Restore" onClick={() => restoreFile(file.id)}>
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-400" title="Delete Permanently" onClick={() => handleDeleteFile(file)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Other Sections */}
          {activeSection === "shared" && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-white mb-4">{getSectionTitle()}</h2>
              <p className="text-gray-500">This section is coming soon</p>
            </div>
          )}
        </div>
      </div>



      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deleteItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Delete Permanently</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete 
              <span className="font-medium text-white">"{deleteItem.name}"</span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => { setShowDeleteConfirm(false); setDeleteItem(null); }} 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmPermanentDelete} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* Storage Subscription Dialog */}
      {showStorageDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Your Storage Plan</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowStorageDialog(false)} className="text-gray-400 hover:text-white">
                  ✕
                </Button>
              </div>
              
              {/* Billing Period Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-800 rounded-lg p-1 flex">
                  <Button
                    variant={billingPeriod === "monthly" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setBillingPeriod("monthly")}
                    className={`px-6 ${billingPeriod === "monthly" ? "bg-[hsl(var(--primary))] text-white" : "text-gray-300 hover:text-white"}`}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={billingPeriod === "annually" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setBillingPeriod("annually")}
                    className={`px-6 ${billingPeriod === "annually" ? "bg-[hsl(var(--primary))] text-white" : "text-gray-300 hover:text-white"}`}
                  >
                    Annually
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Plan */}
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 relative">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2">Basic</h3>
                    <div className="text-3xl font-bold text-[hsl(var(--primary))] mb-1">
                      ${billingPeriod === "monthly" ? "2.99" : "29.99"}
                    </div>
                    <p className="text-sm text-gray-400">per {billingPeriod === "monthly" ? "month" : "year"}</p>
                    {billingPeriod === "annually" && (
                      <p className="text-xs text-green-400 mt-1">Save 17% annually</p>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">{billingPeriod === "monthly" ? "100 GB" : "150 GB"} storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">File sharing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Basic support</span>
                    </div>
                    {billingPeriod === "annually" && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                        <span className="text-sm text-gray-300">Priority email support</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Cancel anytime</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white">
                    Choose Basic
                  </Button>
                </div>
                
                {/* Pro Plan */}
                <div className="bg-gray-800 border-2 border-[hsl(var(--primary))] rounded-lg p-6 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[hsl(var(--primary))] text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
                    <div className="text-3xl font-bold text-[hsl(var(--primary))] mb-1">
                      ${billingPeriod === "monthly" ? "9.99" : "99.99"}
                    </div>
                    <p className="text-sm text-gray-400">per {billingPeriod === "monthly" ? "month" : "year"}</p>
                    {billingPeriod === "annually" && (
                      <p className="text-xs text-green-400 mt-1">Save 17% annually</p>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">{billingPeriod === "monthly" ? "1 TB" : "2 TB"} storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Advanced sharing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Priority support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Version history (30 days)</span>
                    </div>
                    {billingPeriod === "annually" && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                        <span className="text-sm text-gray-300">Advanced encryption</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Cancel anytime</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white">
                    Choose Pro
                  </Button>
                </div>
                
                {/* Enterprise Plan */}
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 relative">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
                    <div className="text-3xl font-bold text-[hsl(var(--primary))] mb-1">
                      ${billingPeriod === "monthly" ? "19.99" : "199.99"}
                    </div>
                    <p className="text-sm text-gray-400">per {billingPeriod === "monthly" ? "month" : "year"}</p>
                    {billingPeriod === "annually" && (
                      <p className="text-xs text-green-400 mt-1">Save 17% annually</p>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Unlimited storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Team collaboration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">24/7 premium support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Advanced security & compliance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Version history (90 days)</span>
                    </div>
                    {billingPeriod === "annually" && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                          <span className="text-sm text-gray-300">Custom integrations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                          <span className="text-sm text-gray-300">Dedicated account manager</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                      <span className="text-sm text-gray-300">Cancel anytime</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white">
                    Choose Enterprise
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">All plans include secure cloud storage and can be cancelled anytime</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      {showCreateFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="mb-4 bg-gray-800 border-gray-600 text-white"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowCreateFolderDialog(false); setNewFolderName(""); }} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Cancel
              </Button>
              <Button onClick={createFolder} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white" disabled={!newFolderName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Dialog */}
      {showDeleteFolderDialog && folderToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Folder</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the folder <span className="font-semibold text-white">"{folderToDelete.name}"</span>? 
              This will permanently delete the folder and all files inside it.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => { setShowDeleteFolderDialog(false); setFolderToDelete(null); }} 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteFolder} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Folder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-[hsl(var(--primary))] rounded-lg px-4 py-3 shadow-lg max-w-sm animate-in slide-in-from-right-full duration-300"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm text-white font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}