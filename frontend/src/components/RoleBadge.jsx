const roleColors = {
  STUDENT: 'bg-blue-100 text-blue-700',
  RESEARCHER: 'bg-purple-100 text-purple-700',
  LAB_TECHNICIAN: 'bg-yellow-100 text-yellow-700',
  LAB_MANAGER: 'bg-green-100 text-green-700',
  DEPARTMENT_HEAD: 'bg-orange-100 text-orange-700',
  INSTITUTION_HEAD: 'bg-red-100 text-red-700',
  SYSTEM_ADMIN: 'bg-gray-100 text-gray-700',
};

export default function RoleBadge({ role }) {
  const colorClass = roleColors[role] || 'bg-gray-100 text-gray-700';
  const displayRole = role?.replace(/_/g, ' ') || 'Unknown';

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
      {displayRole}
    </span>
  );
}
