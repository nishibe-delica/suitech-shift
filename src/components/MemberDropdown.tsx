import { createPortal } from "react-dom";
import type { Member } from "../types";

interface MemberDropdownProps {
  anchorRect: DOMRect;
  members: Member[];
  selectedMemberIds: string[];
  hasLocked: boolean;
  onToggle: (memberId: string) => void;
  onUnlock?: () => void;
  onClose: () => void;
}

export default function MemberDropdown({
  anchorRect,
  members,
  selectedMemberIds,
  hasLocked,
  onToggle,
  onUnlock,
  onClose,
}: MemberDropdownProps) {
  const activeMembers = members.filter((m) => m.active);
  const selectedSet = new Set(selectedMemberIds);

  // 画面右端に収まるよう left を調整
  const dropdownWidth = 176; // min-w-[160px] + padding
  const left = Math.min(
    anchorRect.left,
    window.innerWidth - dropdownWidth - 8
  );
  const top = anchorRect.bottom + 4;

  return createPortal(
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 z-[200]" onClick={onClose} />

      {/* ドロップダウン */}
      <div
        className="fixed z-[201] bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[160px] animate-slide-down"
        style={{ top, left }}
      >
        {activeMembers.map((member) => {
          const isSelected = selectedSet.has(member.id);
          return (
            <button
              key={member.id}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(member.id);
              }}
              className={`px-3 py-2.5 w-full text-left hover:bg-gray-50 flex items-center gap-2.5 text-sm transition-colors cursor-pointer ${
                isSelected ? "bg-brand-50 font-semibold" : ""
              }`}
            >
              {/* チェックボックス */}
              <span
                className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                  isSelected
                    ? "bg-brand-500 border-brand-500"
                    : "border-gray-300 bg-white"
                }`}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: member.color }}
              />
              <span className="text-gray-700">{member.name}</span>
            </button>
          );
        })}

        {/* ロック解除 */}
        {hasLocked && onUnlock && (
          <>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlock();
              }}
              className="px-3 py-2 w-full text-left hover:bg-gray-50 flex items-center gap-2 text-xs text-gray-500 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              ロック解除
            </button>
          </>
        )}

        {/* 閉じるボタン */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-3 py-2 w-full text-center text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
          >
            完了
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
