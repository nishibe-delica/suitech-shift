import { createPortal } from "react-dom";
import type { Member } from "../types";

interface MemberDropdownProps {
  anchorRect: DOMRect;
  members: Member[];
  selectedMemberIds: string[];
  onToggle: (memberId: string) => void;
  onClose: () => void;
}

export default function MemberDropdown({
  anchorRect,
  members,
  selectedMemberIds,
  onToggle,
  onClose,
}: MemberDropdownProps) {
  // 固定メンバー（佐竹さんなど）はドロップダウンから除外
  const activeMembers = members.filter((m) => m.active && !m.isFixed);
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
