"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const ChartFilter = ({
  defaultValue,
  onSelect,
}: {
  defaultValue?: string;
  onSelect: (value: string) => void;
}) => {
  const [filterValue, setFilterValue] = useState<string>();

  useEffect(() => {
    if (defaultValue) {
      setFilterValue(defaultValue);
    }
  }, [defaultValue, setFilterValue]);

  useEffect(() => {
    if (filterValue) {
      onSelect(filterValue);
    }
  }, [filterValue, onSelect]);

  return (
    <div className="py-3 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-lg sm:text-xl font-medium text-white">Chart Filter</h3>
        <p className="text-xs text-gray-400">Select timeframe to view deposit &amp; withdrawal trends</p>
      </div>

      <div>
        <Select
          defaultValue={defaultValue && defaultValue}
          onValueChange={(value) => setFilterValue(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-800 text-xs sm:text-sm">
            <SelectValue placeholder={"Date"} />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ChartFilter;
