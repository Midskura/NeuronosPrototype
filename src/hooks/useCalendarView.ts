import { useState, useCallback, useMemo } from "react";
import type { CalendarViewType, CalendarEvent } from "../types/calendar";
import {
  navigateDate,
  getViewDateRange,
  formatToolbarTitle,
} from "../components/calendar/utils/calendarDateUtils";

export function useCalendarView() {
  const [currentView, setCurrentView] = useState<CalendarViewType>("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);

  // Pre-fill data when clicking a timeslot
  const [slotPreFill, setSlotPreFill] = useState<{
    date: Date;
    hour?: number;
  } | null>(null);

  // Team member overlay visibility
  const [visibleTeamMemberIds, setVisibleTeamMemberIds] = useState<Set<string>>(
    new Set()
  );

  const navigate = useCallback(
    (direction: "prev" | "next" | "today") => {
      setCurrentDate((d) => navigateDate(d, direction, currentView));
    },
    [currentView]
  );

  const dateRange = useMemo(
    () => getViewDateRange(currentDate, currentView),
    [currentDate, currentView]
  );

  const toolbarTitle = useMemo(
    () => formatToolbarTitle(currentDate, currentView),
    [currentDate, currentView]
  );

  const openNewEvent = useCallback(
    (date?: Date, hour?: number) => {
      setSlotPreFill(date ? { date, hour } : null);
      setSelectedEvent(null);
      setIsEventSheetOpen(true);
    },
    []
  );

  const openEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSlotPreFill(null);
    setIsEventSheetOpen(true);
  }, []);

  const closeEventSheet = useCallback(() => {
    setIsEventSheetOpen(false);
    setSelectedEvent(null);
    setSlotPreFill(null);
  }, []);

  const toggleTeamMember = useCallback((userId: string) => {
    setVisibleTeamMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  return {
    // View state
    currentView,
    setCurrentView,
    currentDate,
    selectedDate,
    setSelectedDate,
    dateRange,
    toolbarTitle,

    // Navigation
    navigate,
    goToDate,

    // Event sheet
    isEventSheetOpen,
    selectedEvent,
    slotPreFill,
    openNewEvent,
    openEditEvent,
    closeEventSheet,

    // Team overlay
    visibleTeamMemberIds,
    toggleTeamMember,
  };
}
