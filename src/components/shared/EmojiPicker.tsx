"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared, minimal, branded emoji picker — the single picker used across the app
 * (post composer + messages). Self-contained: no external deps, no portal. The caller
 * positions/anchors it. Clean category tabs + a scrollable grid.
 */

type Category = { id: string; label: string; icon: string; emojis: string[] };

const CATEGORIES: Category[] = [
  {
    id: "smileys", label: "Smileys", icon: "😀",
    emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","😐","😑","😶","😏","😒","🙄","😬","😴","😌","😔","😪","🤤","😷","🤒","🤕","🤢","🤮","🥵","🥶","😎","🤓","🧐","😕","😟","🙁","😮","😯","😲","😳","🥺","😢","😭","😤","😠","😡","🤯","😱","😨","😰","😥"],
  },
  {
    id: "gestures", label: "Gestures", icon: "👍",
    emojis: ["👍","👎","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👏","🙌","👐","🤲","🙏","🤝","💪","✊","👊","🤛","🤜","✋","🖐️","🖖","👋","🫶","👀","🧠","👅","👂","👃"],
  },
  {
    id: "love", label: "Love", icon: "❤️",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🔥","✨","⭐","🌟","💫","💯","🎉","🎊","🏆","🥇"],
  },
  {
    id: "animals", label: "Nature", icon: "🐶",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦄","🐝","🦋","🌸","🌷","🌹","🌻","🌲","🌴","🌍","☀️","🌙","⚡","🌈","🍀","🌊"],
  },
  {
    id: "food", label: "Food", icon: "🍔",
    emojis: ["🍏","🍎","🍌","🍉","🍇","🍓","🍑","🥭","🍍","🥥","🍔","🍟","🍕","🌭","🥪","🌮","🍣","🍩","🍪","🎂","🍰","🍫","🍿","☕","🍵","🍺","🍻","🥂","🍷","🥤"],
  },
  {
    id: "activity", label: "Activity", icon: "⚽",
    emojis: ["⚽","🏀","🏈","⚾","🎾","🏐","🏓","🏸","🥅","🎯","🎮","🕹️","🎲","🧩","🎸","🎹","🎤","🎧","🎬","🚀","✈️","🚗","🏆","🥇","🥈","🥉","🎽","🚴","🏊","🧗"],
  },
  {
    id: "objects", label: "Objects", icon: "💡",
    emojis: ["💡","🔦","💻","🖥️","⌨️","🖱️","📱","📲","☎️","📞","🔋","🔌","💾","💿","📷","🎥","📺","🔍","📚","📖","✏️","🖊️","📝","📌","📎","🔒","🔑","🛠️","⚙️","💼","📈","📉","📊","💰"],
  },
  {
    id: "symbols", label: "Symbols", icon: "✅",
    emojis: ["✅","❌","❓","❗","⚠️","💬","💭","🔔","➕","➖","✔️","☑️","🆗","🆕","🔝","💲","©️","®️","™️","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟪","🔶","🔷"],
  },
];

export function EmojiPicker({
  onSelect,
  onClose,
  className,
}: {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  const [active, setActive] = useState(CATEGORIES[0].id);
  const current = CATEGORIES.find((c) => c.id === active) || CATEGORIES[0];

  return (
    <div className={cn("w-[300px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border-default bg-bg-card shadow-sc-modal overflow-hidden", className)}>
      {/* Category tabs */}
      <div className="flex items-center gap-0.5 px-2 pt-2 pb-1 border-b border-border-subtle overflow-x-auto no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            title={c.label}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg text-lg leading-none flex items-center justify-center transition-colors",
              active === c.id ? "bg-sc-purple-100" : "hover:bg-sc-gray-100"
            )}
          >
            <span>{c.icon}</span>
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="px-2 py-2 max-h-[220px] overflow-y-auto">
        <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{current.label}</div>
        <div className="grid grid-cols-7 gap-0.5">
          {current.emojis.map((e, i) => (
            <button
              key={`${e}-${i}`}
              type="button"
              onClick={() => onSelect(e)}
              className="w-9 h-9 rounded-lg text-xl leading-none flex items-center justify-center hover:bg-sc-purple-50 transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {onClose && (
        <div className="flex justify-end px-2 py-1.5 border-t border-border-subtle">
          <button type="button" onClick={onClose} className="text-[11px] font-semibold text-text-tertiary hover:text-text-secondary px-2 py-1">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default EmojiPicker;
