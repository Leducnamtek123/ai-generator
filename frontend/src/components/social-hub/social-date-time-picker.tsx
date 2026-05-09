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
  const initialDate = parsedValue ?? new Date();
  const [month, setMonth] = React.useState(initialDate);
  const [timeValue, setTimeValue] = React.useState(
    parsedValue ? format(parsedValue, "HH:mm") : "09:00"
  );

  React.useEffect(() => {
    if (!parsedValue) {
      setMonth(new Date());
      setTimeValue("09:00");
      return;
    }

    setMonth(parsedValue);
    setTimeValue(format(parsedValue, "HH:mm"));
  }, [parsedValue]);

  const selectedDate = parsedValue ?? combineDateAndTime(month, timeValue);
  const triggerLabel = parsedValue ? format(parsedValue, "MMM d, yyyy • HH:mm") : placeholder;

  const handleSelectDate = (date: Date) => {
    setMonth(date);
    onChange(toDateTimeLocalValue(combineDateAndTime(date, timeValue)));
  };

  const handleSelectTime = (nextTime: string) => {
    setTimeValue(nextTime);
    onChange(toDateTimeLocalValue(combineDateAndTime(selectedDate, nextTime)));
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
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !parsedValue && "text-muted-foreground")}>
              {triggerLabel}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align="start">
        <div className="flex flex-col gap-3 p-3">
          <Calendar
            selected={parsedValue}
            month={month}
            onSelect={handleSelectDate}
            onMonthChange={setMonth}
          />
          <div className="grid gap-2 border-t border-border pt-3">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                const reset = new Date();
                setMonth(reset);
                setTimeValue("09:00");
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
                onChange(toDateTimeLocalValue(selectedDate));
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
