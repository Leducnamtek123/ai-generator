"use client";

import * as React from "react";

import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type SocialDateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${String(hours).padStart(2, "0")}:${minutes}`;
});

function parseDateTimeLocal(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map((value) => Number(value));
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function SocialDateTimePicker({
  value,
  onChange,
  className,
  triggerClassName,
  placeholder = "Select date & time"
}: SocialDateTimePickerProps) {
  const parsedValue = parseDateTimeLocal(value);
  const [selection, setSelection] = React.useState<{
    month: Date | null;
    timeValue: string;
  }>(() => ({
    month: parsedValue,
    timeValue: parsedValue ? format(parsedValue, "HH:mm") : "09:00",
  }));

  React.useEffect(() => {
    setSelection({
      month: parsedValue,
      timeValue: parsedValue ? format(parsedValue, "HH:mm") : "09:00",
    });
  }, [parsedValue]);

  const { month, timeValue } = selection;

  const selectedDate = parsedValue ?? (month ? combineDateAndTime(month, timeValue) : null);
  const triggerLabel = parsedValue ? format(parsedValue, "MMM d, yyyy HH:mm") : placeholder;

  const handleSelectDate = (date: Date) => {
    setSelection({ month: date, timeValue });
    onChange(toDateTimeLocalValue(combineDateAndTime(date, timeValue)));
  };

  const handleMonthChange = (nextMonth: Date) => {
    setSelection((current) => ({
      ...current,
      month: nextMonth,
    }));
  };

  const handleSelectTime = (nextTime: string) => {
    setSelection({ month, timeValue: nextTime });
    if (selectedDate) {
      onChange(toDateTimeLocalValue(combineDateAndTime(selectedDate, nextTime)));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between gap-3 px-3 text-left font-normal",
            triggerClassName
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !parsedValue && "text-muted-foreground")}>
              {triggerLabel}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align="start">
        <div className="flex flex-col gap-3 p-3">
          <Calendar
            selected={parsedValue}
            month={month ?? undefined}
            onSelect={handleSelectDate}
            onMonthChange={handleMonthChange}
          />
          <div className="grid gap-2 border-t border-border pt-3">
            <div className="text-sm font-medium text-muted-foreground">
              Time
            </div>
            <Select value={timeValue} onValueChange={handleSelectTime}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelection({ month: null, timeValue: "09:00" });
                onChange("");
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (selectedDate) {
                  onChange(toDateTimeLocalValue(selectedDate));
                }
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
