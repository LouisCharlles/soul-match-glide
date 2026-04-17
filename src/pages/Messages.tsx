import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flag,
  ImagePlus,
  MapPinned,
  PlayCircle,
  Search,
  Send,
  SmilePlus,
  X,
} from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import ReportUserDialog from "@/components/ReportUserDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  consumeViewOnceMessage,
  createBlock,
  createStory,
  fetchDateSuggestions,
  fetchMatches,
  fetchMessages,
  fetchMyStories,
  fetchStoriesFeed,
  markConversationAsRead,
  reactToMessage,
  reactToStory,
  registerStoryView,
  sendLocationPing,
  sendMessage,
  mapApiMessageToAppMessage,
  mapApiStory,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useToast } from "@/hooks/use-toast";
import { buildWebSocketUrl } from "@/lib/realtime";
import type { AppMatch, AppMessage, AppStory, DateSuggestion } from "@/lib/types";

const QUICK_REACTIONS = ["❤️", "😂", "🔥", "👏"];

function debugMessages(message: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.debug(`[bonding:messages] ${message}`, details ?? {});
}

interface PendingAttachment {
  file: File;
  type: "image" | "video";
  previewUrl: string;
  source: "gallery" | "camera";
  isViewOnce: boolean;
}

interface StoryGroup {
  key: string;
  source: "mine" | "matches";
  authorId: number;
  authorName: string;
  items: AppStory[];
}

interface ActiveStoryState {
  groupKey: string;
  storyIndex: number;
}

interface MessageRealtimeEvent {
  type: "message.created" | "message.updated" | "message.read";
  data?: unknown;
}

function mergeMessageList(currentMessages: AppMessage[], nextMessage: AppMessage) {
  const filteredMessages = currentMessages.filter((message) => {
    if (message.id === nextMessage.id) {
      return false;
    }
    if (nextMessage.clientRequestId && message.clientRequestId === nextMessage.clientRequestId) {
      return false;
    }
    return true;
  });

  return [...filteredMessages, nextMessage].sort((a, b) => Number(a.id) - Number(b.id));
}

function upsertStoryCollection(currentStories: AppStory[], nextStory: AppStory) {
  return [nextStory, ...currentStories.filter((story) => (
    story.id !== nextStory.id
    && (!nextStory.clientRequestId || story.clientRequestId !== nextStory.clientRequestId)
  ))];
}

function getMatchOnlineStatus(match: AppMatch, presenceByUserId: Record<number, boolean>) {
  return presenceByUserId[match.user.userId] ?? match.user.online;
}

function getMessagePreviewText(message: AppMessage) {
  if (message.text) {
    return message.text;
  }
  if (message.type === "video") {
    return "Vídeo";
  }
  if (message.type === "image") {
    return "Foto";
  }
  return "Nova mensagem";
}

const Messages = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { presenceByUserId, subscribeToStoryEvents } = useRealtime();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMatch, setSelectedMatch] = useState<AppMatch | null>(null);
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<AppMatch[]>([]);
  const [messages, setMessages] = useState<Record<string, AppMessage[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [myStories, setMyStories] = useState<AppStory[]>([]);
  const [matchStories, setMatchStories] = useState<AppStory[]>([]);
  const [activeStory, setActiveStory] = useState<ActiveStoryState | null>(null);
  const [activeViewOnceMessage, setActiveViewOnceMessage] = useState<AppMessage | null>(null);
  const [dateSuggestions, setDateSuggestions] = useState<DateSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DateSuggestion | null>(null);
  const [hasRequestedDateSuggestions, setHasRequestedDateSuggestions] = useState(false);
  const [isStoriesPanelOpen, setIsStoriesPanelOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const matchesRef = useRef<AppMatch[]>([]);
  const selectedMatchRef = useRef<AppMatch | null>(null);
  const selectedChatId = searchParams.get("chat");

  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  useEffect(() => {
    selectedMatchRef.current = selectedMatch;
  }, [selectedMatch]);

  const refreshSidebarData = useCallback(async (options?: { initial?: boolean }) => {
    const initial = options?.initial ?? false;
    if (initial) {
      setIsLoadingMatches(true);
    }

    const [matchesResult, matchStoriesResult, myStoriesResult] = await Promise.allSettled([
      fetchMatches(),
      fetchStoriesFeed(),
      fetchMyStories(),
    ]);

    if (matchesResult.status === "fulfilled") {
      setMatches(matchesResult.value);
    }
    if (matchStoriesResult.status === "fulfilled") {
      setMatchStories(matchStoriesResult.value);
    }
    if (myStoriesResult.status === "fulfilled") {
      setMyStories(myStoriesResult.value);
    }
    setErrorMessage("");
    debugMessages("sidebar bootstrap concluído", {
      initial,
      matchesLoaded: matchesResult.status === "fulfilled",
      feedStoriesLoaded: matchStoriesResult.status === "fulfilled",
      myStoriesLoaded: myStoriesResult.status === "fulfilled",
    });

    setSelectedMatch((currentSelected) => {
      const nextMatches = matchesResult.status === "fulfilled" ? matchesResult.value : matchesRef.current;
      const fallbackSelection = nextMatches[0] ?? null;

      if (selectedChatId) {
        const nextSelected = nextMatches.find((match) => match.id === selectedChatId) ?? fallbackSelection;
        if (!nextSelected) {
          return null;
        }
        return currentSelected?.id === nextSelected.id ? currentSelected : nextSelected;
      }

      if (!currentSelected) {
        return fallbackSelection;
      }

      const updatedCurrent = nextMatches.find((match) => match.id === currentSelected.id);
      if (!updatedCurrent) {
        return fallbackSelection;
      }

      return updatedCurrent.id === currentSelected.id ? currentSelected : updatedCurrent;
    });

    if (initial) {
      setIsLoadingMatches(false);
    }
  }, [selectedChatId]);

  const refreshConversation = useCallback(async (
    match: AppMatch,
    options?: { silent?: boolean; markRead?: boolean },
  ) => {
    const silent = options?.silent ?? false;
    const markRead = options?.markRead ?? true;
    if (!match.conversationId) {
      return;
    }

    if (!silent) {
      setIsLoadingMessages(true);
    }

    debugMessages("carregando conversa", {
      matchId: match.id,
      conversationId: match.conversationId,
      silent,
      markRead,
    });

    const nextMessages = await fetchMessages(match.conversationId, user?.id);
    setMessages((prev) => ({
      ...prev,
      [match.id]: nextMessages,
    }));
    setErrorMessage("");
    if (markRead) {
      await markConversationAsRead(match.conversationId);
      setMatches((prev) =>
        prev.map((item) =>
          item.id === match.id ? { ...item, unread: false } : item,
        ),
      );
    }

    if (!silent) {
      setIsLoadingMessages(false);
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (pendingAttachment?.previewUrl) {
        URL.revokeObjectURL(pendingAttachment.previewUrl);
      }
    };
  }, [pendingAttachment]);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      try {
        if (!isMounted) {
          return;
        }
        await refreshSidebarData({ initial: true });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Tente novamente.";
        setErrorMessage(message);
        toast({
          title: "Não foi possível carregar suas conversas",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoadingMatches(false);
        }
      }
    };

    void loadMatches();

    return () => {
      isMounted = false;
    };
  }, [refreshSidebarData, toast]);

  const filteredMatches = matches
    .filter((match) => match.user.name.toLowerCase().includes(search.toLowerCase()))
    .map((match) => ({
      ...match,
      user: {
        ...match.user,
        online: getMatchOnlineStatus(match, presenceByUserId),
      },
    }));

  const selectedMatchOnline = selectedMatch
    ? getMatchOnlineStatus(selectedMatch, presenceByUserId)
    : false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedMatch, dateSuggestions]);

  useEffect(() => {
    let isMounted = true;

    const loadConversation = async () => {
      if (!selectedMatch?.conversationId) {
        return;
      }

      setIsLoadingMessages(true);
      try {
        if (!isMounted) {
          return;
        }
        await refreshConversation(selectedMatch);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Tente novamente.";
        setErrorMessage(message);
        toast({
          title: "Não foi possível carregar as mensagens",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    void loadConversation();

    return () => {
      isMounted = false;
    };
  }, [refreshConversation, selectedMatch, toast]);

  useEffect(() => {
    return subscribeToStoryEvents((event) => {
      if (event.entity !== "story") {
        return;
      }

      if (event.type === "story.deleted") {
        const storyId = Number((event.data as { id: number }).id);
        setMyStories((current) => current.filter((story) => story.id !== storyId));
        setMatchStories((current) => current.filter((story) => story.id !== storyId));
        return;
      }

      const story = mapApiStory(event.data as never);

      if (story.authorId === user?.id) {
        setMyStories((current) => upsertStoryCollection(current, story));
        return;
      }

      const matchedUserIds = new Set(matchesRef.current.map((match) => match.user.userId));
      if (!matchedUserIds.has(story.authorId)) {
        return;
      }

      setMatchStories((current) => upsertStoryCollection(current, story));
    });
  }, [subscribeToStoryEvents, user?.id]);

  useEffect(() => {
    if (!selectedMatch?.conversationId || !user?.id) {
      return;
    }

    const currentMatchId = selectedMatch.id;
    const currentConversationId = selectedMatch.conversationId;
    const socketUrl = buildWebSocketUrl(`/ws/conversations/${currentConversationId}/`);
    if (!socketUrl) {
      return;
    }

    debugMessages("abrindo websocket da conversa", {
      matchId: currentMatchId,
      conversationId: currentConversationId,
    });
    const socket = new WebSocket(socketUrl);
    const pingTimer = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as MessageRealtimeEvent;

        if (payload.type === "message.created" || payload.type === "message.updated") {
          const nextMessage = mapApiMessageToAppMessage(payload.data as never, user.id);
          setMessages((prev) => {
            const currentMessages = prev[currentMatchId] || [];
            return {
              ...prev,
              [currentMatchId]: mergeMessageList(currentMessages, nextMessage),
            };
          });
          setMatches((prev) =>
            prev.map((match) =>
              match.id === currentMatchId
                ? {
                    ...match,
                    lastMessage: getMessagePreviewText(nextMessage),
                    timestamp: "agora",
                    unread: !nextMessage.isMine,
                  }
                : match,
            ),
          );
        }

        if (payload.type === "message.read") {
          const currentMatch = selectedMatchRef.current;
          if (currentMatch?.id === currentMatchId) {
            void refreshConversation(currentMatch, { silent: true, markRead: false });
          }
        }
      } catch (error) {
        debugMessages("erro ao processar evento realtime da conversa", {
          matchId: currentMatchId,
          conversationId: currentConversationId,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    };

    socket.onopen = () => {
      debugMessages("websocket da conversa conectado", {
        matchId: currentMatchId,
        conversationId: currentConversationId,
      });
      socket.send(JSON.stringify({ type: "ping" }));
    };

    socket.onclose = (event) => {
      debugMessages("websocket da conversa desconectado", {
        matchId: currentMatchId,
        conversationId: currentConversationId,
        code: event.code,
        reason: event.reason,
      });
    };

    return () => {
      window.clearInterval(pingTimer);
      socket.close();
    };
  }, [refreshConversation, selectedMatch?.conversationId, selectedMatch?.id, user?.id]);

  const openChat = (match: AppMatch) => {
    setSelectedMatch(match);
    setDateSuggestions([]);
    setSelectedSuggestion(null);
    setHasRequestedDateSuggestions(false);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("chat", match.id);
      return next;
    });
  };

  const closeChat = () => {
    setSelectedMatch(null);
    setDateSuggestions([]);
    setSelectedSuggestion(null);
    setHasRequestedDateSuggestions(false);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("chat");
      return next;
    });
  };

  const resetAttachment = () => {
    setPendingAttachment((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleAttachmentSelection = (file: File | null, source: "gallery" | "camera") => {
    if (!file) {
      return;
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    resetAttachment();
    setPendingAttachment({
      file,
      type,
      source,
      previewUrl: URL.createObjectURL(file),
      isViewOnce: false,
    });
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !pendingAttachment) || !selectedMatch?.conversationId || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const clientRequestId = crypto.randomUUID();
      const sentMessage = await sendMessage({
        conversationId: selectedMatch.conversationId,
        content: newMessage.trim(),
        file: pendingAttachment?.file ?? null,
        type: pendingAttachment?.type ?? "text",
        isViewOnce: pendingAttachment?.isViewOnce ?? false,
        currentUserId: user?.id,
        clientRequestId,
      });
      setMessages((prev) => ({
        ...prev,
        [selectedMatch.id]: mergeMessageList(prev[selectedMatch.id] || [], sentMessage),
      }));
      setMatches((prev) =>
        prev.map((match) =>
          match.id === selectedMatch.id
            ? {
                ...match,
                lastMessage: getMessagePreviewText(sentMessage),
                timestamp: "agora",
              }
            : match,
        ),
      );
      setNewMessage("");
      resetAttachment();
      setErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      setErrorMessage(message);
      toast({
        title: "Não foi possível enviar a mensagem",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateStory = async () => {
    if (!storyFile) {
      return;
    }

    try {
      const clientRequestId = crypto.randomUUID();
      const story = await createStory({
        file: storyFile,
        mediaType: storyFile.type.startsWith("video/") ? "video" : "image",
        clientRequestId,
      });
      setMyStories((current) => upsertStoryCollection(current, story));
      toast({
        title: "Story publicado",
        description: "Seu story foi enviado para seus matches.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível publicar o story",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setStoryFile(null);
      if (storyFileInputRef.current) {
        storyFileInputRef.current.value = "";
      }
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!selectedMatch) {
      return;
    }
    try {
      const reaction = await reactToMessage(messageId, emoji);
      setMessages((prev) => ({
        ...prev,
        [selectedMatch.id]: (prev[selectedMatch.id] || []).map((message) =>
          message.id === messageId
            ? {
                ...message,
                reactions: [
                  ...(message.reactions || []).filter((item) => item.userName !== reaction.userName),
                  reaction,
                ],
              }
            : message,
        ),
      }));
    } catch (error) {
      toast({
        title: "Não foi possível reagir",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleOpenViewOnce = async (message: AppMessage) => {
    if (!selectedMatch || message.isMine || !message.mediaUrl || message.consumedAt) {
      return;
    }

    try {
      const response = await consumeViewOnceMessage(message.id);
      const consumedAt = String((response as { consumed_at?: string }).consumed_at || new Date().toISOString());
      setMessages((prev) => ({
        ...prev,
        [selectedMatch.id]: (prev[selectedMatch.id] || []).map((item) =>
          item.id === message.id ? { ...item, consumedAt } : item,
        ),
      }));
      setActiveViewOnceMessage({ ...message, consumedAt });
    } catch (error) {
      toast({
        title: "Não foi possível abrir a mídia",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const requestLocationPing = async () => {
    if (!("geolocation" in navigator)) {
      throw new Error("Seu dispositivo não disponibilizou geolocalização no navegador.");
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    await sendLocationPing({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyMeters: position.coords.accuracy,
    });
  };

  const handleSuggestDate = async () => {
    if (!selectedMatch) {
      return;
    }

    setIsLoadingSuggestions(true);
    setHasRequestedDateSuggestions(true);
    try {
      await requestLocationPing();
      const suggestions = await fetchDateSuggestions(selectedMatch.id);
      setDateSuggestions(suggestions);
      setSelectedSuggestion(suggestions[0] ?? null);
      setErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      const friendlyMessage = message.includes("User denied Geolocation")
        ? "Ative a localização do dispositivo para receber sugestões de lugar."
        : message.includes("Localizacao recente indisponivel")
          ? "Sua localização foi enviada, mas o outro usuário ainda não compartilhou uma localização recente."
          : message;

      toast({
        title: "Não foi possível sugerir um lugar",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const groupedStories = useMemo<StoryGroup[]>(() => {
    const createGroups = (stories: AppStory[], source: "mine" | "matches") => {
      const map = new Map<string, StoryGroup>();
      stories.forEach((story) => {
        const key = `${source}-${story.authorId}`;
        const existing = map.get(key);
        if (existing) {
          existing.items.push(story);
          return;
        }
        map.set(key, {
          key,
          source,
          authorId: story.authorId,
          authorName: source === "mine" ? "Seu story" : story.authorName,
          items: [story],
        });
      });
      return Array.from(map.values()).map((group) => ({
        ...group,
        items: group.items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      }));
    };

    return [...createGroups(myStories, "mine"), ...createGroups(matchStories, "matches")];
  }, [myStories, matchStories]);

  const activeStoryGroup = useMemo(
    () => groupedStories.find((group) => group.key === activeStory?.groupKey) ?? null,
    [activeStory, groupedStories],
  );

  const activeStoryItem = activeStoryGroup && activeStory
    ? activeStoryGroup.items[activeStory.storyIndex] ?? null
    : null;

  const openStoryGroup = async (group: StoryGroup, storyIndex = 0) => {
    const boundedIndex = Math.max(0, Math.min(storyIndex, group.items.length - 1));
    setActiveStory({ groupKey: group.key, storyIndex: boundedIndex });
    if (group.source === "matches") {
      await registerStoryView(group.items[boundedIndex].id);
    }
  };

  const goToStory = async (direction: "next" | "prev") => {
    if (!activeStory || !activeStoryGroup) {
      return;
    }

    if (direction === "next") {
      if (activeStory.storyIndex < activeStoryGroup.items.length - 1) {
        await openStoryGroup(activeStoryGroup, activeStory.storyIndex + 1);
        return;
      }
      const currentGroupIndex = groupedStories.findIndex((group) => group.key === activeStoryGroup.key);
      const nextGroup = groupedStories[currentGroupIndex + 1];
      if (nextGroup) {
        await openStoryGroup(nextGroup, 0);
        return;
      }
      setActiveStory(null);
      return;
    }

    if (activeStory.storyIndex > 0) {
      await openStoryGroup(activeStoryGroup, activeStory.storyIndex - 1);
      return;
    }
    const currentGroupIndex = groupedStories.findIndex((group) => group.key === activeStoryGroup.key);
    const previousGroup = groupedStories[currentGroupIndex - 1];
    if (previousGroup) {
      await openStoryGroup(previousGroup, previousGroup.items.length - 1);
    }
  };

  const showChat = selectedMatch !== null;

  return (
    <section className="flex h-[calc(100dvh-11.5rem)] min-h-[38rem] flex-col gap-4 lg:h-[calc(100dvh-10rem)]" aria-labelledby="messages-heading">
      <h1 id="messages-heading" className="sr-only">Mensagens</h1>
      <div className="sr-only" aria-live="polite">
        {selectedMatch ? `Conversa aberta com ${selectedMatch.user.name}.` : "Lista de conversas visível."}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Stories</p>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe as atualizações dos seus matches sem poluir a conversa.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsStoriesPanelOpen((current) => !current)}>
              {isStoriesPanelOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {isStoriesPanelOpen ? "Recolher stories" : "Abrir stories"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => storyFileInputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              Publicar story
            </Button>
            <input
              ref={storyFileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => setStoryFile(event.target.files?.[0] ?? null)}
            />
            {storyFile ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-muted-foreground">
                <span className="max-w-[11rem] truncate">{storyFile.name}</span>
                <Button size="sm" className="h-8" onClick={() => void handleCreateStory()}>
                  Enviar
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {isStoriesPanelOpen ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {groupedStories.map((group) => {
            const previewStory = group.items[group.items.length - 1];
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => void openStoryGroup(group)}
                className="flex min-w-[4.75rem] flex-col items-center gap-2"
              >
                <div className={`h-16 w-16 overflow-hidden rounded-full border-2 p-0.5 ${group.source === "mine" ? "border-white/20" : "border-primary"}`}>
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-accent/30">
                    {previewStory.mediaType === "video" ? (
                      <div className="flex h-full w-full items-center justify-center bg-primary/15">
                        <PlayCircle className="h-6 w-6 text-primary" />
                      </div>
                    ) : (
                      <img src={previewStory.mediaUrl} alt={group.authorName} className="h-full w-full object-cover" />
                    )}
                  </div>
                </div>
                <div className="w-full">
                  <p className="truncate text-[11px] text-muted-foreground">{group.authorName.split("@")[0]}</p>
                  <div className="mt-1 flex gap-1">
                    {group.items.map((story) => (
                      <span
                        key={story.id}
                        className={`h-1 flex-1 rounded-full ${group.source === "mine" ? "bg-white/25" : "bg-primary/60"}`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
          {groupedStories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-muted-foreground">
              Nenhum story ativo por enquanto.
            </div>
          ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className={`${showChat ? "hidden lg:flex" : "flex"} w-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-card lg:w-[23rem] xl:w-[26rem]`}>
          <div className="border-b border-white/10 p-4">
            {errorMessage ? (
              <Alert variant="destructive" className="mb-3 border-destructive/40 bg-destructive/5 text-foreground">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Algo saiu do esperado</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar conversas"
                placeholder="Buscar matches..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="border-0 bg-accent pl-9 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingMatches ? (
              <div className="p-4 text-sm font-body text-muted-foreground">Carregando matches...</div>
            ) : null}
            {filteredMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => openChat(match)}
                aria-label={`Abrir conversa com ${match.user.name}`}
                className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50 ${
                  selectedMatch?.id === match.id ? "bg-accent" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={match.user.photos[0]} alt={match.user.name} className="h-14 w-14 rounded-full border-2 border-primary object-cover" />
                  {match.user.online ? (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-success" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-heading text-foreground">{match.user.name}</span>
                      {match.user.verified ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <span className="text-xs font-body text-muted-foreground">{match.timestamp}</span>
                  </div>
                  <p className="truncate text-xs font-body text-muted-foreground">{match.lastMessage}</p>
                </div>
              </button>
            ))}
            {!isLoadingMatches && filteredMatches.length === 0 ? (
              <div className="p-4 text-sm font-body text-muted-foreground">Nenhuma conversa encontrada.</div>
            ) : null}
          </div>
        </div>

        <div className={`${showChat ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-card`}>
          {selectedMatch ? (
            <>
              <div className="relative z-20 flex items-center gap-3 border-b border-white/10 bg-card px-4 py-3">
                <button onClick={closeChat} className="text-muted-foreground hover:text-foreground lg:hidden">
                  <span className="sr-only">Voltar para a lista de conversas</span>
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <img src={selectedMatch.user.photos[0]} alt={`Foto de perfil de ${selectedMatch.user.name}`} className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-heading text-foreground">{selectedMatch.user.name}</p>
                    {selectedMatch.user.verified ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                  </div>
                  <p className={`text-xs font-body ${selectedMatchOnline ? "text-success" : "text-muted-foreground"}`}>
                    {selectedMatchOnline ? "Online" : "Offline"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleSuggestDate()} disabled={isLoadingSuggestions}>
                    <MapPinned className="mr-2 h-4 w-4" />
                    {isLoadingSuggestions ? "Localizando..." : "Sugerir date"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      try {
                        await createBlock(selectedMatch.user.userId, "Bloqueado pela conversa");
                        toast({
                          title: "Usuário bloqueado",
                          description: "Essa pessoa não aparecerá mais para você.",
                        });
                        closeChat();
                      } catch (error) {
                        toast({
                          title: "Não foi possível bloquear",
                          description: error instanceof Error ? error.message : "Tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    aria-label={`Denunciar ${selectedMatch.user.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {dateSuggestions.length > 0 ? (
                  <div className="grid gap-3 pb-2">
                    <div className="grid gap-3 xl:grid-cols-2">
                      {dateSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.name}-${suggestion.mapsUrl}`}
                          type="button"
                          onClick={() => setSelectedSuggestion(suggestion)}
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            selectedSuggestion?.mapsUrl === suggestion.mapsUrl
                              ? "border-primary bg-primary/10"
                              : "border-white/10 bg-accent/30"
                          }`}
                        >
                          <p className="font-body-bold text-foreground">{suggestion.name}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.vicinity}</p>
                          <p className="mt-1 text-xs text-primary">
                            {suggestion.distanceKm} km · nota {suggestion.rating ?? "s/n"}
                          </p>
                        </button>
                      ))}
                    </div>
                    {selectedSuggestion ? (
                      <div className="rounded-[1.75rem] border border-white/10 bg-background/35 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-heading text-foreground">{selectedSuggestion.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedSuggestion.vicinity}</p>
                          </div>
                          <a href={selectedSuggestion.mapsUrl} target="_blank" rel="noreferrer" className="text-sm font-body-bold text-primary">
                            Abrir no Google Maps
                          </a>
                        </div>
                        <GoogleMap
                          latitude={selectedSuggestion.latitude}
                          longitude={selectedSuggestion.longitude}
                          title={selectedSuggestion.name}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {hasRequestedDateSuggestions && !isLoadingSuggestions && dateSuggestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-background/25 p-4 text-sm text-muted-foreground">
                    Nenhum lugar disponível foi encontrado no meio do caminho entre vocês agora.
                  </div>
                ) : null}

                {isLoadingMessages ? (
                  <div className="text-sm font-body text-muted-foreground">Carregando mensagens...</div>
                ) : null}

                {(messages[selectedMatch.id] || []).map((message) => {
                  const isMine = message.isMine;
                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm font-body xl:max-w-[70%] ${
                          isMine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-accent text-foreground"
                        }`}
                      >
                        {message.text ? <p>{message.text}</p> : null}

                        {message.mediaUrl ? (
                          message.isViewOnce && !message.isMine ? (
                            message.consumedAt ? (
                              <div className="mt-2 rounded-xl border border-white/10 bg-background/20 px-3 py-3 text-xs uppercase tracking-[0.18em]">
                                Foto de visualização única já aberta
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleOpenViewOnce(message)}
                                className="mt-2 flex w-full items-center justify-center rounded-xl border border-dashed border-white/20 px-4 py-4 text-center text-xs uppercase tracking-[0.18em] transition-colors hover:bg-background/10"
                              >
                                Toque para abrir a foto de visualização única
                              </button>
                            )
                          ) : message.type === "video" ? (
                            <video src={message.mediaUrl} controls className="mt-2 max-h-72 w-full rounded-xl" />
                          ) : (
                            <img src={message.mediaUrl} alt="Mídia da conversa" className="mt-2 max-h-72 w-full rounded-xl object-cover" />
                          )
                        ) : null}

                        {message.isViewOnce ? (
                          <p className="mt-2 text-[10px] uppercase tracking-[0.2em]">
                            {message.isMine ? "Enviado como visualização única" : message.consumedAt ? "Visualização única consumida" : "Visualização única"}
                          </p>
                        ) : null}

                        {(message.reactions || []).length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(message.reactions || []).map((reaction) => (
                              <span key={reaction.id} className="rounded-full bg-background/20 px-2 py-1 text-[10px]">
                                {reaction.emoji}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className={`text-[10px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{message.timestamp}</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-background/15 text-inherit transition-colors hover:bg-background/25"
                                aria-label="Reagir à mensagem"
                              >
                                <SmilePlus className="h-4 w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto border-white/10 bg-card p-2">
                              <div className="flex gap-1">
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={`${message.id}-${emoji}`}
                                    type="button"
                                    onClick={() => void handleReactToMessage(message.id, emoji)}
                                    className="rounded-full px-2 py-1 text-lg transition-colors hover:bg-accent"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!isLoadingMessages && (messages[selectedMatch.id] || []).length === 0 ? (
                  <div className="text-sm font-body text-muted-foreground">Ainda não há mensagens nessa conversa.</div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              <div className="relative z-20 border-t border-white/10 bg-card/95 p-3 backdrop-blur-md">
                {pendingAttachment ? (
                  <div className="mb-3 rounded-2xl border border-white/10 bg-background/35 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {pendingAttachment.type === "video" ? (
                          <video src={pendingAttachment.previewUrl} className="h-16 w-16 rounded-xl object-cover" />
                        ) : (
                          <img src={pendingAttachment.previewUrl} alt="Prévia da mídia" className="h-16 w-16 rounded-xl object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-body-bold text-foreground">{pendingAttachment.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pendingAttachment.source === "camera" ? "Capturada pela câmera" : "Selecionada da galeria"}
                          </p>
                          {pendingAttachment.type === "image" || pendingAttachment.type === "video" ? (
                            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={pendingAttachment.isViewOnce}
                                onChange={(event) =>
                                  setPendingAttachment((current) =>
                                    current ? { ...current, isViewOnce: event.target.checked } : current,
                                  )
                                }
                              />
                              Enviar como visualização única
                            </label>
                          ) : null}
                        </div>
                      </div>
                      <button type="button" onClick={resetAttachment} className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(event) => handleAttachmentSelection(event.target.files?.[0] ?? null, "gallery")}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => handleAttachmentSelection(event.target.files?.[0] ?? null, "camera")}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => galleryInputRef.current?.click()}>
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Input
                    aria-label="Digite sua mensagem"
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border-0 bg-accent text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={(!newMessage.trim() && !pendingAttachment) || isSending}
                    aria-label="Enviar mensagem"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm font-body text-muted-foreground">
              Selecione uma conversa para começar
            </div>
          )}
        </div>
      </div>

      <ReportUserDialog
        isOpen={reportOpen}
        user={selectedMatch?.user ?? null}
        onClose={() => setReportOpen(false)}
        onReported={() => {
          setReportOpen(false);
          toast({
            title: "Denúncia enviada",
            description: "Recebemos sua denúncia e vamos analisar o caso.",
          });
        }}
      />

      <Dialog open={Boolean(activeStory && activeStoryGroup && activeStoryItem)} onOpenChange={(open) => !open && setActiveStory(null)}>
        <DialogContent className="border-white/10 bg-background/95 sm:max-w-2xl">
          {activeStoryGroup && activeStoryItem ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {activeStoryGroup.items.map((story, index) => (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => void openStoryGroup(activeStoryGroup, index)}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        index <= (activeStory?.storyIndex ?? 0) ? "bg-primary" : "bg-white/15"
                      }`}
                      aria-label={`Abrir segmento ${index + 1} do story`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-heading text-foreground">{activeStoryGroup.authorName}</p>
                    <p className="text-xs text-muted-foreground">{activeStoryItem.viewersCount} visualizações</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => void goToStory("prev")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => void goToStory("next")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {activeStoryGroup.source === "matches" ? (
                  <div className="flex gap-2">
                    {QUICK_REACTIONS.map((emoji) => (
                      <Button
                        key={`story-${emoji}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const reaction = await reactToStory(activeStoryItem.id, emoji);
                            setMatchStories((current) =>
                              current.map((story) =>
                                story.id === activeStoryItem.id
                                  ? {
                                      ...story,
                                      reactions: [
                                        ...story.reactions.filter((item) => item.userName !== reaction.userName),
                                        reaction,
                                      ],
                                    }
                                  : story,
                              ),
                            );
                          } catch (error) {
                            toast({
                              title: "Não foi possível reagir ao story",
                              description: error instanceof Error ? error.message : "Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>

              {activeStoryItem.mediaType === "video" ? (
                <video src={activeStoryItem.mediaUrl} controls className="max-h-[70vh] w-full rounded-2xl" />
              ) : (
                <img src={activeStoryItem.mediaUrl} alt={activeStoryItem.caption || activeStoryGroup.authorName} className="max-h-[70vh] w-full rounded-2xl object-cover" />
              )}
              {activeStoryItem.caption ? <p className="text-sm text-muted-foreground">{activeStoryItem.caption}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activeViewOnceMessage)} onOpenChange={(open) => !open && setActiveViewOnceMessage(null)}>
        <DialogContent className="border-white/10 bg-background/95">
          {activeViewOnceMessage?.mediaUrl ? (
            activeViewOnceMessage.type === "video" ? (
              <video src={activeViewOnceMessage.mediaUrl} controls autoPlay className="max-h-[70vh] w-full rounded-2xl" />
            ) : (
              <img src={activeViewOnceMessage.mediaUrl} alt="Mídia de visualização única" className="max-h-[70vh] w-full rounded-2xl object-cover" />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Messages;
