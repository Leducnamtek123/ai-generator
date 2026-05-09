"use client";

import * as React from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from "date-fns";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type CalendarProps = {
  selected?: Date | null;
  month?: Date;
  onSelect?: (date: Date) => void;
  onMonthChange?: (month: Date) => void;
  className?: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildDays(month: Date) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthEnd = endOfMonth(month);
  const gridEnd = addDays(monthEnd, 6 - ((monthEnd.getDay() + 6) % 7));
  const days: Date[] = [];

  for (let current = gridStart; current <= gridEnd; current = addDays(current, 1)) {
    days.push(current);
  }

  return days;
}

function Calendar({ selected, month, onSelect, onMonthChange, className }: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(month ?? selected ?? new Date());

  React.useEffect(() => {
    if (month) {
      setInternalMonth(month);
      return;
    }

    if (selected) {
      setInternalMonth(selected);
    }
  }, [month, selected]);

  const displayMonth = month ?? internalMonth;
  const days = buildDays(displayMonth);

  const updateMonth = (nextMonth: Date) => {
    if (onMonthChange) {
      onMonthChange(nextMonth);
    } else {
      setInternalMonth(nextMonth);
    }
  };

  return (
    <div className={cn("w-[320px] p-3", className)}>
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="text-sm font-semibold text-foreground">
          {format(displayMonth, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            onClick={() => updateMonth(addMonths(displayMonth, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            onClick={() => updateMonth(addMonths(displayMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, displayMonth);
          const isSelected = Boolean(selected && isSameDay(day, selected));
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
                isCurrentMonth
                  ? "text-foreground hover:bg-accent hover:text-accent-foreground"
                  : "text-muted-foreground/40",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday && !isSelected && "ring-1 ring-primary/40"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
