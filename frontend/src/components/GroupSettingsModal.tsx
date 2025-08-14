import {
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/firebaseFetch";

import type { Group, GroupMember } from "../types";

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  members: GroupMember[];
  currentUserAccountId: string;
  onUpdateGroup?: (updatedGroup: Group) => void;
  onDataRefresh?: () => void; // Callback to refresh all group data
}

const EMOJI_OPTIONS = [
  "🏠",
  "🚗",
  "🍕",
  "💰",
  "🎉",
  "🏖️",
  "🍔",
  "🎬",
  "🎮",
  "🏋️",
];

export default function GroupSettingsModal({
  isOpen,
  onClose,
  group,
  members,
  currentUserAccountId,
  onUpdateGroup,
  onDataRefresh,
}: GroupSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "members" | "danger">(
    "general"
  );
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || "");
  const [selectedIcon, setSelectedIcon] = useState(group?.icon || "🏠");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
    null
  );
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  // Sync state when group prop changes
  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setSelectedIcon(group.icon);
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const isAdmin = group.admin_account_id.toString() === currentUserAccountId;

  const handleSaveChanges = async () => {
    try {
      setIsProcessing(true);

      // Call API to update group
      const response = await authFetch(
        `http://localhost:4000/api/groups/${group.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: groupName,
            icon: selectedIcon,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update group");
      }

      // Update local state via parent callback
      const updatedGroup = { ...group, name: groupName, icon: selectedIcon };
      onUpdateGroup?.(updatedGroup);

      // Trigger data refresh to get updated activity
      onDataRefresh?.();

      setEditingName(false);
    } catch (err) {
      console.error("Error updating group:", err);
      alert(
        err instanceof Error
          ? `Failed to update group: ${err.message}`
          : "Failed to update group. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    try {
      setIsProcessing(true);

      // Call API to remove member
      const response = await authFetch(
        `http://localhost:4000/api/groups/${group.id}/members/${member.account_id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      // Trigger complete data refresh to update balances, activity, etc.
      onDataRefresh?.();
      setMemberToRemove(null);
    } catch (err) {
      console.error("Error removing member:", err);
      alert(
        err instanceof Error
          ? `Failed to remove member: ${err.message}`
          : "Failed to remove member. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setIsProcessing(true);

      // Call API to leave group
      const response = await authFetch(
        `http://localhost:4000/api/groups/${group.id}/leave`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to leave group");
      }

      // Navigate back to groups list
      navigate("/group-payments");
    } catch (err) {
      console.error("Error leaving group:", err);
      alert(
        err instanceof Error
          ? `Failed to leave group: ${err.message}`
          : "Failed to leave group. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setIsProcessing(true);

      // Call API to delete group
      const response = await authFetch(
        `http://localhost:4000/api/groups/${group.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete group");
      }

      // Navigate back to groups list
      navigate("/group-payments");
    } catch (err) {
      console.error("Error deleting group:", err);
      alert(
        err instanceof Error
          ? `Failed to delete group: ${err.message}`
          : "Failed to delete group. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberUsername.trim()) return;

    try {
      setIsProcessing(true);
      setAddMemberError(null);

      // Call API to add member
      const response = await authFetch(
        `http://localhost:4000/api/groups/${group.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: newMemberUsername.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }

      // Trigger complete data refresh to update balances, activity, etc.
      onDataRefresh?.();

      setNewMemberUsername("");
      setShowAddMember(false);
    } catch (error) {
      console.error("Error adding member:", error);
      setAddMemberError(
        error instanceof Error ? error.message : "Failed to add member"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGroupIconChange = async (emoji: string) => {
    if (!group || !isAdmin) return;

    try {
      setIsProcessing(true);
      setSelectedIcon(emoji);

      // Call API to update group with current name and new icon
      const response = await authFetch(
        `http://localhost:4000/api/groups/${group.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: group.name, // Use the actual group name, not the editing state
            icon: emoji,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update group icon");
      }

      // Update local state via parent callback
      const updatedGroup = { ...group, name: group.name, icon: emoji };
      onUpdateGroup?.(updatedGroup);

      // Trigger data refresh to get updated activity
      onDataRefresh?.();
    } catch (err) {
      console.error("Error updating group icon:", err);
      // Revert the icon if the update failed
      setSelectedIcon(group.icon);
      alert(
        err instanceof Error
          ? `Failed to update group icon: ${err.message}`
          : "Failed to update group icon. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-xl sm:rounded-xl shadow-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Group Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: "general", label: "General" },
            { id: "members", label: "Members" },
            { id: "danger", label: "Danger" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-0 py-3 px-3 sm:px-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Group Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Group Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleGroupIconChange(emoji)}
                      disabled={!isAdmin}
                      className={`p-2 sm:p-3 text-xl sm:text-2xl rounded-lg border-2 transition-colors ${
                        selectedIcon === emoji
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${
                        !isAdmin
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter group name"
                    />
                    <button
                      onClick={handleSaveChanges}
                      disabled={!groupName.trim() || isProcessing}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-300 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setGroupName(group.name);
                        setSelectedIcon(group.icon);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{group.name}</span>
                    {isAdmin && (
                      <button
                        onClick={() => setEditingName(true)}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Group Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Group Information
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>
                    Created: {new Date(group.created_at).toLocaleDateString()}
                  </div>
                  <div>Members: {members.length}</div>
                  <div>
                    Admin:{" "}
                    {members.find(
                      (m) => m.account_id === group.admin_account_id
                    )?.username || "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-medium text-gray-900">
                  Group Members ({members.length})
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Add Member
                  </button>
                )}
              </div>

              {/* Add Member Form */}
              {showAddMember && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Add New Member</h4>
                  {addMemberError && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {addMemberError}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newMemberUsername}
                      onChange={(e) => setNewMemberUsername(e.target.value)}
                      placeholder="Enter username"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddMember();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddMember}
                        disabled={!newMemberUsername.trim() || isProcessing}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-300 transition-colors text-sm"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddMember(false);
                          setNewMemberUsername("");
                          setAddMemberError(null);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.account_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-full flex items-center justify-center text-sm font-medium text-teal-700 flex-shrink-0">
                        {member.first_name
                          ? member.first_name[0]
                          : member.username[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">
                          <span className="truncate">
                            {member.first_name && member.last_name
                              ? `${member.first_name} ${member.last_name}`
                              : member.username}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.account_id === group.admin_account_id && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Admin
                              </span>
                            )}
                            {member.is_current_user && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">
                          @{member.username}
                        </div>
                      </div>
                    </div>

                    {isAdmin && !member.is_current_user && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              {/* Leave Group */}
              {!isAdmin && (
                <div className="border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        Leave Group
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        You will lose access to this group and its history. Any
                        outstanding balances should be settled first.
                      </p>
                      <button
                        onClick={() => setShowLeaveConfirm(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Leave Group
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Group (Admin only) */}
              {isAdmin && (
                <div className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        Delete Group
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        This action cannot be undone. All group data, expenses,
                        and history will be permanently deleted.
                      </p>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete Group
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Remove Member Confirmation */}
      {memberToRemove && (
        <div
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-gray-900/50 px-4"
          onClick={() => setMemberToRemove(null)}
        >
          <div
            className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Remove Member
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Are you sure you want to remove{" "}
              <strong>{memberToRemove.username}</strong> from this group?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleRemoveMember(memberToRemove)}
                disabled={isProcessing}
                className="py-3 sm:py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => setMemberToRemove(null)}
                className="py-3 sm:py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Confirmation */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-gray-900/50 px-4"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Leave Group
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Are you sure you want to leave this group? You will lose access to
              all group data and history.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLeaveGroup}
                disabled={isProcessing}
                className="py-3 sm:py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
              >
                Leave Group
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="py-3 sm:py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-gray-900/50 px-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Delete Group
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Are you sure you want to delete this group? This action cannot be
              undone and all data will be permanently lost.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteGroup}
                disabled={isProcessing}
                className="py-3 sm:py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors"
              >
                Delete Group
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-3 sm:py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
