const MOCK_GROUPS = [
  {
    id: 1,
    name: "Pickleball",
    members: ["John", "Jane", "Jim"],
    icon: "🥒",
  },
  {
    id: 2,
    name: "Gym",
    members: ["John", "Jane"],
    icon: "🏋️",
  },
  {
    id: 3,
    name: "Volleyball",
    members: ["John", "Jane", "Jim", "Jill"],
    icon: "🏐",
  },
];

export default function GroupPayments() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Group Payments</h1>
        <p className="text-gray-600 mt-2">
          Request and split money with group members
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MOCK_GROUPS.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl font-bold">{group.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {group.name}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
