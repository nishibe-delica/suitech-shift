import type { Member } from "../types";

interface MemberDropdownProps {
  members: Member[];
  currentMemberId: string | null;
  isLocked: boolean;
  onSelect: (memberId: string) => void;
  onUnlock?: () => void;
  onClose: () => void;
}

export default function MemberDropdown({
  members,
  currentMemberId,
  isLocked,
  onSelect,
  onUnlock,
  onClose,
}: MemberDropdownProps) {
  const activeMembers = members.filter((m) => m.active);

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 z-10" onClick={onClose} />

      {/* ドロップダウン */}
      <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[140px] animate-slide-down">
        {activeMembers.map((member) => (
          <button
            key={member.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(member.id);
            }}
            className={`px-3 py-2 w-full text-left hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors cursor-pointer ${
              member.id === currentMemberId
                ? "bg-brand-50 font-semibold"
                : ""
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            <span className="text-gray-700">{member.name}</span>
            {member.id === currentMemberId && (
              <svg
                className="w-3.5 h-3.5 text-brand-500 ml-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
        {isLocked && onUnlock && (
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
      </div>
    </>
  );
}
