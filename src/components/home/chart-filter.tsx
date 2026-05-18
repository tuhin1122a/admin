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
    <div className="py-5 flex items-center justify-between">
      <h3 className="text-xl font-medium text-white">Chart Filter</h3>

      <div>
        <Select
          defaultValue={defaultValue && defaultValue}
          onValueChange={(value) => setFilterValue(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={"Date"} />
          </SelectTrigger>
          <SelectContent>
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
