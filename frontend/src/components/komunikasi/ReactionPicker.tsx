"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { REACTION_TYPES, ReactionType } from "@/types/komunikasi";

interface ReactionPickerProps {
  onReaction: (reactionType: string) => void;
  onClose: () => void;
  currentReaction?: string;
}

export default function ReactionPicker({ onReaction, onClose, currentReaction }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleReactionClick = (reactionType: string) => {
    onReaction(reactionType);
  };

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 z-50"
    >
      <Card className="shadow-lg border-2">
        <CardContent className="p-2">
          <div className="flex space-x-1">
            {Object.entries(REACTION_TYPES).map(([type, emoji]) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => handleReactionClick(type)}
                className={`
                  p-2 h-auto min-w-0 hover:scale-125 transition-transform
                  ${currentReaction === type 
                    ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                title={getReactionLabel(type)}
              >
                <span className="text-lg">{emoji}</span>
              </Button>
            ))}
          </div>
          
          {/* Remove reaction option if user has already reacted */}
          {currentReaction && (
            <>
              <div className="border-t my-2"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReactionClick(currentReaction)}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Hapus reaksi
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getReactionLabel(reactionType: string): string {
  switch (reactionType) {
    case 'LIKE':
      return 'Suka';
    case 'DISLIKE':
      return 'Tidak Suka';
    default:
      return reactionType;
  }
}
