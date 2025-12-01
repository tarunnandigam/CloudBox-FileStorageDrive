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
  Home,
  HardDrive,
  FileText,
  Clock,
  Heart,
  ShoppingCart,
  Share2,
  Edit3
} from "lucide-react";
import { logOut } from "@/lib/auth/auth.actions";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user.context";
import { uploadFilesToSpring, getFilesFromSpring, deleteFileFromSpring, downloadFileFromSpring, FileResponse } from "@/lib/api/files.actions";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { current: user, signout } = useUser();

  const userEmail = user?.email || "user@example.com";
  const userName = user?.name || userEmail.split("@")[0];

  const handleLogout = async () => {
    await signout();
    await logOut();
    router.push("/auth");
  };

  const handleFileUpload = async (uploadedFiles: FileList | File[]) => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      await uploadFilesToSpring(uploadedFiles, user.email);
      await loadFiles();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!user?.email) return;
    
    try {
      const userFiles = await getFilesFromSpring(user.email);
      setFiles(userFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!user?.email) return;
    
    try {
      await deleteFileFromSpring(fileId, user.email);
      await loadFiles();
    } catch (error) {
      console.error('Delete failed:', error);
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
    // Only set dragging to false if we're leaving the main container
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

  // Add window-level drag and drop support
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only hide if dragging outside the window
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
  }, [user?.email]);

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
            <h1 className="text-lg md:text-xl font-bold">CloudBox</h1>
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

      {/* Horizontal Toolbar */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white flex-1 sm:flex-none" onClick={handleUploadClick} disabled={loading}>
              <Upload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{loading ? 'Uploading...' : 'Upload'}</span>
            </Button>
            <Button variant="outline" className="border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white flex-1 sm:flex-none">
              <FolderPlus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Folder</span>
            </Button>
          </div>
          
          {/* Search Bar */}
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
            <Button variant="ghost" className="w-full justify-start text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white">
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-[hsl(var(--primary))] hover:text-white">
              <HardDrive className="w-4 h-4 mr-3" />
              My Drive
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-[hsl(var(--primary))] hover:text-white">
              <FileText className="w-4 h-4 mr-3" />
              Files
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-[hsl(var(--primary))] hover:text-white">
              <Clock className="w-4 h-4 mr-3" />
              Recent
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-[hsl(var(--primary))] hover:text-white">
              <Heart className="w-4 h-4 mr-3" />
              Favourite
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-[hsl(var(--primary))] hover:text-white">
              <Trash2 className="w-4 h-4 mr-3" />
              Trash
            </Button>
          </nav>
          
          {/* Storage Info */}
          <div className="mt-6 md:mt-8 p-4 bg-gray-900 rounded-lg">
            <h3 className="text-sm font-medium mb-3">Storage</h3>
            <p className="text-xs text-gray-400 mb-2">17.1 / 20 GB Used</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div className="bg-[hsl(var(--primary))] h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            
            <p className="text-xs text-gray-400 mb-4">75% Full - 3.9 GB Free</p>
            
            <Button size="sm" className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Buy Storage</span>
              <span className="sm:hidden">Buy</span>
            </Button>
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

          {/* Files Grid/List */}
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center px-4">
              <Folder className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-400 mb-2">No files yet</h3>
              <p className="text-sm md:text-base text-gray-500 mb-6">Upload your first file or create a folder to get started</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/.9)] text-white" onClick={handleUploadClick}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
                <Button variant="outline" className="border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4 hidden md:block">Or drag and drop files here</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <File className="w-8 h-8 text-blue-400" />
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 hover:bg-gray-700" title="Share">
                          <Share2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700" title="Download" onClick={() => handleDownloadFile(file.id, file.name)}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400 hover:bg-gray-700" title="Rename">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700" title="Delete" onClick={() => handleDeleteFile(file.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700" title="More">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-medium text-sm mb-1" title={file.name}>
                      {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                    </h4>
                    <p className="text-xs text-gray-400">{file.size}</p>
                    <p className="text-xs text-gray-500">{file.modified}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 cursor-pointer">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm" title={file.name}>
                        {file.name.length > 40 ? `${file.name.substring(0, 40)}...` : file.name}
                      </h4>
                      <p className="text-xs text-gray-400">{file.size} • {file.modified}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-gray-700" title="Share">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700" title="Download" onClick={() => handleDownloadFile(file.id, file.name)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-yellow-400 hover:bg-gray-700" title="Rename">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700" title="Delete" onClick={() => handleDeleteFile(file.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700" title="More">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}