"use client";

import { useState, useEffect, useCallback } from "react";
import { Share2, Globe, Lock, Copy, X, Loader2, UserPlus, Trash, User, ChevronDown } from "lucide-react";
import { toggleFolderShare, addCollaborator, removeCollaborator } from "@/app/actions/share";
import { searchUsers } from "@/app/actions/users";
import { useRouter } from "next/navigation";

// Simple debounce hook implementation inline if not exists
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface ShareFolderDialogProps {
  folderId: string;
  initialIsShared: boolean;
  initialSharedWith: { userId: string; role: "viewer" | "editor" }[];
}

interface UserResult {
    clerkId: string;
    email: string;
    username?: string;
}

export function ShareFolderDialog({ folderId, initialIsShared, initialSharedWith = [] }: ShareFolderDialogProps) {
  const [isShared, setIsShared] = useState(initialIsShared);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Search State
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounceValue(query, 500);
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Collaborators State
  const [collaborators, setCollaborators] = useState<{ userId: string; role: "viewer" | "editor" }[]>(initialSharedWith);

  // Selected Role for new user
  const [selectedRole, setSelectedRole] = useState<"viewer" | "editor">("viewer");

  useEffect(() => {
    setIsShared(initialIsShared);
    // Simple deep comparison check to update if props change from server revalidation
    if(JSON.stringify(collaborators) !== JSON.stringify(initialSharedWith)){
        setCollaborators(initialSharedWith || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIsShared, JSON.stringify(initialSharedWith)]);

  // Handle Search
  useEffect(() => {
      async function doSearch() {
          if (debouncedQuery.length < 2) {
              setSearchResults([]);
              return;
          }
          setIsSearching(true);
          try {
              const results = await searchUsers(debouncedQuery);
              setSearchResults(results);
          } catch (e) {
              console.error("Search failed", e);
          } finally {
              setIsSearching(false);
          }
      }
      doSearch();
  }, [debouncedQuery]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await toggleFolderShare(folderId);
      setIsShared(result.isShared);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle share", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async (userId: string) => {
      if(collaborators.some(c => c.userId === userId)) return;
      
      const newCollab = { userId, role: selectedRole };

      // Optimistic update
      setCollaborators(prev => [...prev, newCollab]);
      setQuery(""); // Clear search
      setSearchResults([]);

      try {
          await addCollaborator(folderId, userId, selectedRole);                                                                      
          router.refresh();
      } catch (e) {
          console.error("Failed to add collaborator", e);
          // Revert on error
          setCollaborators(prev => prev.filter(c => c.userId !== userId));
          alert("Failed to add user");
      }
  };

  const handleRemoveCollaborator = async (userId: string) => {
      if(!confirm("Remove this user?")) return;

      const removed = collaborators.find(c => c.userId === userId);
      // Optimistic update
      setCollaborators(prev => prev.filter(c => c.userId !== userId));

      try {
          await removeCollaborator(folderId, userId);
          router.refresh();
      } catch (e) {
          console.error("Failed to remove collaborator", e);
          // Revert
          if(removed) setCollaborators(prev => [...prev, removed]);
          alert("Failed to remove user");
      }
  };

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/folders/${folderId}`
    : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!"); 
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-foreground rounded-lg transition-colors text-sm font-medium"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
               {/* Header */}
               <div className="flex items-center justify-between p-4 border-b shrink-0">
                  <h3 className="text-lg font-semibold">Share Folder</h3>
                  <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                  </button>
               </div>

               {/* Content - Scrollable */}
               <div className="p-6 space-y-8 overflow-y-auto">
                  
                  {/* 1. Public Link Section */}
                  <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Public Access</h4>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-1">
                              <label className="font-medium flex items-center gap-2">
                                  {isShared ? <Globe className="w-4 h-4 text-blue-500"/> : <Lock className="w-4 h-4 text-gray-500"/>}
                                  Public Link
                              </label>
                              <p className="text-xs text-muted-foreground">
                                  {isShared ? "Anyone with the link can view." : "Only accessible to you and added people."}
                              </p>
                          </div>
                          
                          <button 
                            onClick={handleToggle}
                            disabled={loading}
                            className={`
                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none 
                                ${isShared ? 'bg-primary' : 'bg-input'}
                            `}
                          >
                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isShared ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                      </div>

                      {isShared && (
                          <div className="flex gap-2">
                              <input readOnly value={shareUrl} className="flex-1 px-3 py-2 bg-muted border rounded-md text-xs text-muted-foreground" />
                              <button onClick={copyToClipboard} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-xs font-medium flex gap-2 items-center">
                                  <Copy className="w-3 h-3" /> Copy
                              </button>
                          </div>
                      )}
                  </div>

                  <hr className="border-border/50" />

                  {/* 2. Specific People Section */}
                  <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Specific People</h4>
                      
                      {/* Search Input & Role Select */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder="Add people by email..." 
                                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <UserPlus className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                            
                            {/* Search Results Dropdown */}
                            {(searchResults.length > 0 || isSearching) && (
                                <div className="absolute z-10 w-full mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden">
                                    {isSearching && <div className="p-3 text-xs text-center text-muted-foreground">Searching...</div>}
                                    {searchResults.map(user => (
                                        <button 
                                            key={user.clerkId}
                                            onClick={() => handleAddCollaborator(user.clerkId)}
                                            className="w-full text-left p-3 hover:bg-muted flex items-center justify-between group transition-colors border-b last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {user.username?.[0] || user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{user.username || "User"}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md font-medium shadow-sm hover:bg-primary/90">
                                                Add as {selectedRole}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Role Selector */}
                        <div className="relative shrink-0">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as "viewer" | "editor")}
                                className="h-full px-3 py-2 bg-background border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none appearance-none pr-8 cursor-pointer"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-2 top-3 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* Collaborator List */}
                      {collaborators.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                             {collaborators.map((collab, idx) => (
                                 <div key={collab.userId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                     <div className="flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                             <User className="w-3 h-3 text-gray-500" />
                                         </div>
                                         <div className="flex flex-col">
                                            <span className="text-sm font-medium">User: ...{collab.userId.slice(-4)}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{collab.role}</span>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => handleRemoveCollaborator(collab.userId)}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                     >
                                         <Trash className="w-4 h-4" />
                                     </button>
                                 </div>
                             ))}
                          </div>
                      )}
                  </div>

               </div>
               
               {/* Footer */}
               <div className="p-4 border-t bg-muted/10 flex justify-end">
                  <button 
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                      Done
                  </button>
               </div>
            </div>
         </div>
      )}
    </>
  );
}
