import type { Member } from "../types";

const TARGET_DAYS = 105;

interface MemberLegendBarProps {
  members: Member[];
  dutyCounts: Record<string, number>;
  individualHolidays: Record<string, number>;
  hasAssignments: boolean;
}

function getDiffStyle(diff: number) {
  if (diff === 0) return { ring: "ring-green-400", text: "text-green-600", label: "✅" };
  if (Math.abs(diff) <= 1) return { ring: "ring-amber-400", text: "text-amber-600", label: diff > 0 ? `+${diff}` : `${diff}` };
  return { ring: "ring-red-400", text: "text-red-500", label: diff > 0 ? `+${diff}` : `${diff}` };
}

export default function MemberLegendBar({
  members,
  dutyCounts,
  individualHolidays,
  hasAssignments,
}: MemberLegendBarProps) {
  const activeMembers = members.filter((m) => m.active);
  const allOk = hasAssignments && activeMembers.every(
    (m) => individualHolidays[m.id] === TARGET_DAYS
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {activeMembers.map((member) => {
        const days = individualHolidays[member.id] ?? 0;
        const diff = hasAssignments ? days - TARGET_DAYS : null;
        const style = diff !== null ? getDiffStyle(diff) : null;

        return (
          <div
            key={member.id}
            className={`inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 transition-all hover:shadow-md ${
              style ? `ring-2 ${style.ring}` : ""
            }`}
          >
            <span
              className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: member.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {member.name}
            </span>
            <span className="text-sm font-bold text-brand-600">
              {dutyCounts[member.id] ?? 0}回
            </span>
            {diff !== null && (
              <span className={`text-xs font-semibold ${style!.text}`}>
                {diff === 0 ? "105日✅" : `${days}日(${style!.label})`}
              </span>
            )}
          </div>
        );
      })}

      {/* 全体ステータス */}
      {hasAssignments && (
        <div className={`ml-auto text-xs font-medium px-3 py-1.5 rounded-full ${
          allOk
            ? "bg-green-50 text-green-700 ring-1 ring-green-200"
            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
        }`}>
          {allOk ? "全員 105日 ✅" : "要調整あり ⚠️"}
        </div>
      )}
    </div>
  );
}
