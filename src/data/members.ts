import type { Member } from "../types";

export const defaultMembers: Member[] = [
  {
    id: "taniwaki",
    name: "谷脇",
    color: "#E6F1FB",
    order: 1,
    active: true,
    isMarathonMember: false,
  },
  {
    id: "miki",
    name: "三木",
    color: "#E1F5EE",
    order: 2,
    active: true,
    isMarathonMember: true,
  },
  {
    id: "nishibe",
    name: "西部",
    color: "#FAECE7",
    order: 3,
    active: true,
    isMarathonMember: true,
  },
  {
    id: "yamada",
    name: "山田",
    color: "#EEEDFE",
    order: 4,
    active: true,
    isMarathonMember: true,
  },
  {
    id: "satake",
    name: "佐竹",
    color: "#FFF0D6",
    order: 5,
    active: true,
    isMarathonMember: false,
    isFixed: true, // ローテーション対象外・固定出勤
  },
];

export const defaultRotationOrder = ["taniwaki", "miki", "nishibe", "yamada"];
