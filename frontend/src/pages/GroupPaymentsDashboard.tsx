import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlackButton from "../components/BlackButton";
import { authFetch } from "../services/firebaseFetch";
import type { Group } from "../types";

export default function GroupPaymentsDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupIcon, setNewGroupIcon] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const groups = await authFetch("http://localhost:4000/api/groups", {
        method: "GET",
      });
      const groupsData = await groups.json();
      setGroups(groupsData);
    };
    fetchGroups();
  }, []);

  const navigate = useNavigate();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const addMember = () => {
    if (newMemberEmail.trim() && !newMembers.includes(newMemberEmail.trim())) {
      setNewMembers([...newMembers, newMemberEmail.trim()]);
      setNewMemberEmail("");
    }
  };

  const removeMember = (emailToRemove: string) => {
    setNewMembers(newMembers.filter((email) => email !== emailToRemove));
  };

  const handleSubmitGroup = async () => {
    if (newGroupName.trim() && newGroupIcon.trim()) {
      const response = await authFetch("http://localhost:4000/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: newGroupName,
          icon: newGroupIcon,
          newMembers: newMembers.map((member) => member.trim()),
        }),
      });
      const responseData = await response.json();

      setGroups([...groups, responseData[0]]);

      // Reset form
      setNewGroupName("");
      setNewGroupIcon("");
      setNewMemberEmail("");
      setNewMembers([]);
      closeModal();
    } else {
      // TODO: Show error message
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Group Payments</h1>
          <p className="text-gray-600 mt-2">
            Request and split money with group members
          </p>
        </div>

        <div className="hidden sm:block">
          <BlackButton onClick={openModal} className="py-3">
            <PlusIcon className="w-4 h-4" />
            New Group
          </BlackButton>
        </div>
      </div>

      <BlackButton onClick={openModal} className="sm:hidden py-3 w-full">
        <PlusIcon className="w-4 h-4" />
        New Group
      </BlackButton>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.length > 0 &&
          groups.map((group) => (
            <button
              key={group.id}
              className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:bg-slate-100 transition-all"
              onClick={() => {
                navigate(`/group-payments/${group.id}`);
              }}
            >
              <div className="flex items-center justify-center mb-4">
                <span className="text-5xl font-bold">{group.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {group.name}
              </h3>
            </button>
          ))}
      </div>

      {/* Group Creation Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
              Create New Group
            </h3>

            <div className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Group Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Icon *
                </label>
                <input
                  type="text"
                  value={newGroupIcon}
                  onChange={(e) => setNewGroupIcon(e.target.value)}
                  placeholder="Enter an emoji (e.g., 🏀, 🍕, 🎮)"
                  maxLength={1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Add Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Members
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Enter username"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && addMember()}
                  />
                  <button
                    onClick={addMember}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Members List */}
              {newMembers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Members ({newMembers.length})
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                    {newMembers.map((member, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center px-3 py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm text-gray-700 truncate">
                          {member}
                        </span>
                        <button
                          onClick={() => removeMember(member)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSubmitGroup}
                className="flex-1 py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                Create Group
              </button>
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
