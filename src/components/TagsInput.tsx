"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have shadcn's utils

export interface TagsInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  separator?: string | RegExp;
  max?: number;
  maxLength?: number;
  minLength?: number;
  className?: string;
  inputClassName?: string;
  tagClassName?: string;
}

const TagsInput = React.forwardRef<HTMLInputElement, TagsInputProps>(
  (
    {
      value = [],
      onChange,
      placeholder = "Add a tag...",
      separator = /[,\s]/,
      max = 10,
      maxLength = 20,
      minLength = 1,
      className,
      inputClassName,
      tagClassName,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        (separator instanceof RegExp
          ? separator.test(e.key)
          : separator === e.key) ||
        e.key === "Enter"
      ) {
        e.preventDefault();
        addTag();
      } else if (e.key === "Backspace" && inputValue === "") {
        e.preventDefault();
        removeTag(value.length - 1);
      }
    };

    const addTag = () => {
      if (inputValue.trim() === "") return;

      const newTag = inputValue.trim();

      if (minLength && newTag.length < minLength) {
        return;
      }

      if (maxLength && newTag.length > maxLength) {
        return;
      }

      if (value.includes(newTag)) {
        setInputValue("");
        return;
      }

      if (max && value.length >= max) {
        return;
      }

      onChange([...value, newTag]);
      setInputValue("");
    };

    const removeTag = (index: number) => {
      const newTags = [...value];
      newTags.splice(index, 1);
      onChange(newTags);
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (inputValue.trim() !== "") {
        addTag();
      }
    };

    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
      >
        {value.map((tag, index) => (
          <div
            key={index}
            className={cn(
              "inline-flex items-center bg-[#0E121C] rounded-md  px-2 py-1 text-sm font-medium",
              tagClassName
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-2 rounded-full p-0.5 hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < max && (
          <div className="relative flex-1">
            <input
              ref={ref}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              placeholder={isFocused || value.length === 0 ? placeholder : ""}
              className={cn(
                "w-full min-w-[80px]  outline-none placeholder:text-muted-foreground",
                inputClassName
              )}
              maxLength={maxLength}
              {...props}
            />
            {inputValue.trim() !== "" && (
              <button
                type="button"
                onClick={addTag}
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

TagsInput.displayName = "TagsInput";

export { TagsInput };
