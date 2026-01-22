import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, Bookmark } from "./supabase";

// Types
export interface Chat {
  id: string;
  user_id: string;
  verse_text: string;
  verse_reference: string;
  user_question: string;
  explanation_data: {
    verse_explanation: string;
    connection_to_user_need: string;
    guidance_application: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

interface CacheData {
  bookmarks: Bookmark[] | null;
  chats: Chat[] | null;
  streak: UserStreak | null;
  activityDates: string[] | null;
}

interface CacheTimestamps {
  bookmarks: number;
  chats: number;
  streak: number;
  activityDates: number;
}

interface DataCacheContextType {
  // Data
  bookmarks: Bookmark[] | null;
  chats: Chat[] | null;
  streak: UserStreak | null;
  activityDates: string[] | null;
  
  // Loading states
  isLoadingBookmarks: boolean;
  isLoadingChats: boolean;
  isLoadingStreak: boolean;
  isLoadingActivityDates: boolean;
  
  // Initial load states (true until first successful fetch)
  isInitialLoadBookmarks: boolean;
  isInitialLoadChats: boolean;
  
  // Fetch functions (returns cached data instantly, refreshes in background if stale)
  fetchBookmarks: (forceRefresh?: boolean) => Promise<Bookmark[]>;
  fetchChats: (forceRefresh?: boolean) => Promise<Chat[]>;
  fetchStreak: (forceRefresh?: boolean) => Promise<UserStreak | null>;
  fetchActivityDates: (forceRefresh?: boolean) => Promise<string[]>;
  
  // Invalidation (call after mutations)
  invalidateBookmarks: () => void;
  invalidateChats: () => void;
  invalidateStreak: () => void;
  invalidateAll: () => void;
  
  // Optimistic updates (for instant UI feedback)
  addBookmarkOptimistic: (bookmark: Bookmark) => void;
  removeBookmarkOptimistic: (bookmarkId: string) => void;
  removeMultipleBookmarksOptimistic: (bookmarkIds: string[]) => void;
  addChatOptimistic: (chat: Chat) => void;
  removeChatOptimistic: (chatId: string) => void;
  removeMultipleChatsOptimistic: (chatIds: string[]) => void;
  updateChatOptimistic: (chatId: string, updates: Partial<Chat>) => void;
  
  // Preload all data (call on app start/login)
  preloadAllData: () => Promise<void>;
  
  // Clear cache (call on logout)
  clearCache: () => void;
}

const DataCacheContext = createContext<DataCacheContextType | null>(null);

// Cache configuration
const CACHE_TTL = 60 * 1000; // 1 minute - data is considered "fresh" for this long
const STALE_TTL = 5 * 60 * 1000; // 5 minutes - data is "stale but usable" for this long
const STORAGE_KEY_PREFIX = "data_cache_";

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
  // In-memory cache
  const [cache, setCache] = useState<CacheData>({
    bookmarks: null,
    chats: null,
    streak: null,
    activityDates: null,
  });
  
  const [timestamps, setTimestamps] = useState<CacheTimestamps>({
    bookmarks: 0,
    chats: 0,
    streak: 0,
    activityDates: 0,
  });
  
  // Loading states
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingStreak, setIsLoadingStreak] = useState(false);
  const [isLoadingActivityDates, setIsLoadingActivityDates] = useState(false);
  
  // Initial load states
  const [isInitialLoadBookmarks, setIsInitialLoadBookmarks] = useState(true);
  const [isInitialLoadChats, setIsInitialLoadChats] = useState(true);
  
  // Request deduplication - prevent multiple simultaneous requests
  const pendingRequests = useRef<{
    bookmarks: Promise<Bookmark[]> | null;
    chats: Promise<Chat[]> | null;
    streak: Promise<UserStreak | null> | null;
    activityDates: Promise<string[]> | null;
  }>({
    bookmarks: null,
    chats: null,
    streak: null,
    activityDates: null,
  });

  // User ID ref for quick access
  const userIdRef = useRef<string | null>(null);

  // Get user ID (cached)
  const getUserId = useCallback(async (): Promise<string | null> => {
    if (userIdRef.current) return userIdRef.current;
    
    const { data: { user } } = await supabase.auth.getUser();
    userIdRef.current = user?.id || null;
    return userIdRef.current;
  }, []);

  // Load cache from AsyncStorage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const keys = ["bookmarks", "chats", "streak", "activityDates"] as const;
        const results = await AsyncStorage.multiGet(
          keys.map(k => `${STORAGE_KEY_PREFIX}${k}`)
        );
        
        const newCache: Partial<CacheData> = {};
        const newTimestamps: Partial<CacheTimestamps> = {};
        
        results.forEach(([key, value], index) => {
          if (value) {
            try {
              const parsed = JSON.parse(value);
              const cacheKey = keys[index];
              newCache[cacheKey] = parsed.data;
              newTimestamps[cacheKey] = parsed.timestamp || 0;
            } catch {
              // Invalid cache, ignore
            }
          }
        });
        
        if (Object.keys(newCache).length > 0) {
          setCache(prev => ({ ...prev, ...newCache }));
          setTimestamps(prev => ({ ...prev, ...newTimestamps }));
        }
      } catch (error) {
        console.warn("[DataCache] Error loading from storage:", error);
      }
    };
    
    loadFromStorage();
  }, []);

  // Save to AsyncStorage helper
  const saveToStorage = useCallback(async (key: keyof CacheData, data: any, timestamp: number) => {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEY_PREFIX}${key}`,
        JSON.stringify({ data, timestamp })
      );
    } catch (error) {
      console.warn("[DataCache] Error saving to storage:", error);
    }
  }, []);

  // Check if cache is fresh
  const isFresh = useCallback((key: keyof CacheTimestamps): boolean => {
    return Date.now() - timestamps[key] < CACHE_TTL;
  }, [timestamps]);

  // Check if cache is stale but usable
  const isUsable = useCallback((key: keyof CacheTimestamps): boolean => {
    return Date.now() - timestamps[key] < STALE_TTL;
  }, [timestamps]);

  // ==================== FETCH FUNCTIONS ====================

  const fetchBookmarks = useCallback(async (forceRefresh = false): Promise<Bookmark[]> => {
    // Return cached if fresh and not forcing refresh
    if (!forceRefresh && cache.bookmarks !== null && isFresh("bookmarks")) {
      return cache.bookmarks;
    }

    // If request is already in flight, wait for it
    if (pendingRequests.current.bookmarks) {
      return pendingRequests.current.bookmarks;
    }

    // If we have usable cache, return it immediately and refresh in background
    const hasUsableCache = cache.bookmarks !== null && isUsable("bookmarks");
    
    const fetchPromise = (async (): Promise<Bookmark[]> => {
      if (!hasUsableCache) {
        setIsLoadingBookmarks(true);
      }
      
      try {
        const userId = await getUserId();
        if (!userId) return [];

        const { data, error } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[DataCache] Error fetching bookmarks:", error);
          return cache.bookmarks || [];
        }

        const bookmarks = data || [];
        const now = Date.now();
        
        setCache(prev => ({ ...prev, bookmarks }));
        setTimestamps(prev => ({ ...prev, bookmarks: now }));
        setIsInitialLoadBookmarks(false);
        saveToStorage("bookmarks", bookmarks, now);
        
        return bookmarks;
      } finally {
        setIsLoadingBookmarks(false);
        pendingRequests.current.bookmarks = null;
      }
    })();

    pendingRequests.current.bookmarks = fetchPromise;
    
    // If we have usable cache, return it immediately
    if (hasUsableCache && !forceRefresh) {
      // Fire and forget background refresh
      fetchPromise.catch(() => {}); 
      return cache.bookmarks!;
    }
    
    return fetchPromise;
  }, [cache.bookmarks, isFresh, isUsable, getUserId, saveToStorage]);

  const fetchChats = useCallback(async (forceRefresh = false): Promise<Chat[]> => {
    if (!forceRefresh && cache.chats !== null && isFresh("chats")) {
      return cache.chats;
    }

    if (pendingRequests.current.chats) {
      return pendingRequests.current.chats;
    }

    const hasUsableCache = cache.chats !== null && isUsable("chats");
    
    const fetchPromise = (async (): Promise<Chat[]> => {
      if (!hasUsableCache) {
        setIsLoadingChats(true);
      }
      
      try {
        const userId = await getUserId();
        if (!userId) return [];

        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("[DataCache] Error fetching chats:", error);
          return cache.chats || [];
        }

        const chats = data || [];
        const now = Date.now();
        
        setCache(prev => ({ ...prev, chats }));
        setTimestamps(prev => ({ ...prev, chats: now }));
        setIsInitialLoadChats(false);
        saveToStorage("chats", chats, now);
        
        return chats;
      } finally {
        setIsLoadingChats(false);
        pendingRequests.current.chats = null;
      }
    })();

    pendingRequests.current.chats = fetchPromise;
    
    if (hasUsableCache && !forceRefresh) {
      fetchPromise.catch(() => {});
      return cache.chats!;
    }
    
    return fetchPromise;
  }, [cache.chats, isFresh, isUsable, getUserId, saveToStorage]);

  const fetchStreak = useCallback(async (forceRefresh = false): Promise<UserStreak | null> => {
    if (!forceRefresh && cache.streak !== null && isFresh("streak")) {
      return cache.streak;
    }

    if (pendingRequests.current.streak) {
      return pendingRequests.current.streak;
    }

    const hasUsableCache = cache.streak !== null && isUsable("streak");
    
    const fetchPromise = (async (): Promise<UserStreak | null> => {
      if (!hasUsableCache) {
        setIsLoadingStreak(true);
      }
      
      try {
        const userId = await getUserId();
        if (!userId) return null;

        const { data, error } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("[DataCache] Error fetching streak:", error);
          return cache.streak;
        }

        const streak = data || null;
        const now = Date.now();
        
        setCache(prev => ({ ...prev, streak }));
        setTimestamps(prev => ({ ...prev, streak: now }));
        saveToStorage("streak", streak, now);
        
        return streak;
      } finally {
        setIsLoadingStreak(false);
        pendingRequests.current.streak = null;
      }
    })();

    pendingRequests.current.streak = fetchPromise;
    
    if (hasUsableCache && !forceRefresh) {
      fetchPromise.catch(() => {});
      return cache.streak;
    }
    
    return fetchPromise;
  }, [cache.streak, isFresh, isUsable, getUserId, saveToStorage]);

  const fetchActivityDates = useCallback(async (forceRefresh = false): Promise<string[]> => {
    if (!forceRefresh && cache.activityDates !== null && isFresh("activityDates")) {
      return cache.activityDates;
    }

    if (pendingRequests.current.activityDates) {
      return pendingRequests.current.activityDates;
    }

    const hasUsableCache = cache.activityDates !== null && isUsable("activityDates");
    
    const fetchPromise = (async (): Promise<string[]> => {
      if (!hasUsableCache) {
        setIsLoadingActivityDates(true);
      }
      
      try {
        const userId = await getUserId();
        if (!userId) return [];

        const { data, error } = await supabase
          .from("chats")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[DataCache] Error fetching activity dates:", error);
          return cache.activityDates || [];
        }

        // Extract unique dates (using LOCAL timezone)
        const uniqueDates = new Set<string>();
        data?.forEach((chat) => {
          const date = new Date(chat.created_at);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          uniqueDates.add(`${year}-${month}-${day}`);
        });

        const activityDates = Array.from(uniqueDates);
        const now = Date.now();
        
        setCache(prev => ({ ...prev, activityDates }));
        setTimestamps(prev => ({ ...prev, activityDates: now }));
        saveToStorage("activityDates", activityDates, now);
        
        return activityDates;
      } finally {
        setIsLoadingActivityDates(false);
        pendingRequests.current.activityDates = null;
      }
    })();

    pendingRequests.current.activityDates = fetchPromise;
    
    if (hasUsableCache && !forceRefresh) {
      fetchPromise.catch(() => {});
      return cache.activityDates!;
    }
    
    return fetchPromise;
  }, [cache.activityDates, isFresh, isUsable, getUserId, saveToStorage]);

  // ==================== INVALIDATION FUNCTIONS ====================

  const invalidateBookmarks = useCallback(() => {
    setTimestamps(prev => ({ ...prev, bookmarks: 0 }));
  }, []);

  const invalidateChats = useCallback(() => {
    setTimestamps(prev => ({ ...prev, chats: 0, activityDates: 0 }));
  }, []);

  const invalidateStreak = useCallback(() => {
    setTimestamps(prev => ({ ...prev, streak: 0 }));
  }, []);

  const invalidateAll = useCallback(() => {
    setTimestamps({ bookmarks: 0, chats: 0, streak: 0, activityDates: 0 });
  }, []);

  // ==================== OPTIMISTIC UPDATE FUNCTIONS ====================

  const addBookmarkOptimistic = useCallback((bookmark: Bookmark) => {
    setCache(prev => ({
      ...prev,
      bookmarks: prev.bookmarks ? [bookmark, ...prev.bookmarks] : [bookmark],
    }));
  }, []);

  const removeBookmarkOptimistic = useCallback((bookmarkId: string) => {
    setCache(prev => ({
      ...prev,
      bookmarks: prev.bookmarks?.filter(b => b.id !== bookmarkId) || null,
    }));
  }, []);

  const removeMultipleBookmarksOptimistic = useCallback((bookmarkIds: string[]) => {
    const idSet = new Set(bookmarkIds);
    setCache(prev => ({
      ...prev,
      bookmarks: prev.bookmarks?.filter(b => !idSet.has(b.id)) || null,
    }));
  }, []);

  const addChatOptimistic = useCallback((chat: Chat) => {
    setCache(prev => ({
      ...prev,
      chats: prev.chats ? [chat, ...prev.chats] : [chat],
    }));
    // Also update activity dates
    const date = new Date(chat.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    setCache(prev => ({
      ...prev,
      activityDates: prev.activityDates && !prev.activityDates.includes(dateStr)
        ? [dateStr, ...prev.activityDates]
        : prev.activityDates,
    }));
  }, []);

  const removeChatOptimistic = useCallback((chatId: string) => {
    setCache(prev => ({
      ...prev,
      chats: prev.chats?.filter(c => c.id !== chatId) || null,
    }));
  }, []);

  const removeMultipleChatsOptimistic = useCallback((chatIds: string[]) => {
    const idSet = new Set(chatIds);
    setCache(prev => ({
      ...prev,
      chats: prev.chats?.filter(c => !idSet.has(c.id)) || null,
    }));
  }, []);

  const updateChatOptimistic = useCallback((chatId: string, updates: Partial<Chat>) => {
    setCache(prev => ({
      ...prev,
      chats: prev.chats?.map(c => 
        c.id === chatId ? { ...c, ...updates } : c
      ) || null,
    }));
  }, []);

  // ==================== PRELOAD & CLEAR ====================

  const preloadAllData = useCallback(async () => {
    // Parallel fetch all data
    await Promise.all([
      fetchBookmarks(true),
      fetchChats(true),
      fetchStreak(true),
    ]);
  }, [fetchBookmarks, fetchChats, fetchStreak]);

  const clearCache = useCallback(async () => {
    userIdRef.current = null;
    setCache({
      bookmarks: null,
      chats: null,
      streak: null,
      activityDates: null,
    });
    setTimestamps({
      bookmarks: 0,
      chats: 0,
      streak: 0,
      activityDates: 0,
    });
    setIsInitialLoadBookmarks(true);
    setIsInitialLoadChats(true);
    
    // Clear AsyncStorage
    try {
      await AsyncStorage.multiRemove([
        `${STORAGE_KEY_PREFIX}bookmarks`,
        `${STORAGE_KEY_PREFIX}chats`,
        `${STORAGE_KEY_PREFIX}streak`,
        `${STORAGE_KEY_PREFIX}activityDates`,
      ]);
    } catch (error) {
      console.warn("[DataCache] Error clearing storage:", error);
    }
  }, []);

  const value: DataCacheContextType = {
    bookmarks: cache.bookmarks,
    chats: cache.chats,
    streak: cache.streak,
    activityDates: cache.activityDates,
    
    isLoadingBookmarks,
    isLoadingChats,
    isLoadingStreak,
    isLoadingActivityDates,
    
    isInitialLoadBookmarks,
    isInitialLoadChats,
    
    fetchBookmarks,
    fetchChats,
    fetchStreak,
    fetchActivityDates,
    
    invalidateBookmarks,
    invalidateChats,
    invalidateStreak,
    invalidateAll,
    
    addBookmarkOptimistic,
    removeBookmarkOptimistic,
    removeMultipleBookmarksOptimistic,
    addChatOptimistic,
    removeChatOptimistic,
    removeMultipleChatsOptimistic,
    updateChatOptimistic,
    
    preloadAllData,
    clearCache,
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache must be used within a DataCacheProvider");
  }
  return context;
}

// Convenience hooks for specific data
export function useBookmarks() {
  const { 
    bookmarks, 
    isLoadingBookmarks, 
    isInitialLoadBookmarks,
    fetchBookmarks,
    invalidateBookmarks,
    addBookmarkOptimistic,
    removeBookmarkOptimistic,
    removeMultipleBookmarksOptimistic,
  } = useDataCache();
  
  return {
    bookmarks,
    isLoading: isLoadingBookmarks,
    isInitialLoad: isInitialLoadBookmarks,
    refresh: fetchBookmarks,
    invalidate: invalidateBookmarks,
    addOptimistic: addBookmarkOptimistic,
    removeOptimistic: removeBookmarkOptimistic,
    removeMultipleOptimistic: removeMultipleBookmarksOptimistic,
  };
}

export function useChats() {
  const { 
    chats, 
    isLoadingChats, 
    isInitialLoadChats,
    fetchChats,
    invalidateChats,
    addChatOptimistic,
    removeChatOptimistic,
    removeMultipleChatsOptimistic,
    updateChatOptimistic,
  } = useDataCache();
  
  return {
    chats,
    isLoading: isLoadingChats,
    isInitialLoad: isInitialLoadChats,
    refresh: fetchChats,
    invalidate: invalidateChats,
    addOptimistic: addChatOptimistic,
    removeOptimistic: removeChatOptimistic,
    removeMultipleOptimistic: removeMultipleChatsOptimistic,
    updateOptimistic: updateChatOptimistic,
  };
}

export function useStreak() {
  const { 
    streak, 
    isLoadingStreak, 
    fetchStreak,
    invalidateStreak,
  } = useDataCache();
  
  return {
    streak,
    isLoading: isLoadingStreak,
    refresh: fetchStreak,
    invalidate: invalidateStreak,
  };
}

export function useActivityDates() {
  const { 
    activityDates, 
    isLoadingActivityDates, 
    fetchActivityDates,
  } = useDataCache();
  
  return {
    activityDates,
    isLoading: isLoadingActivityDates,
    refresh: fetchActivityDates,
  };
}
