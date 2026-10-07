// Mock data for the /contact Zalo-style chat UI. No backend exists yet for
// friends/groups/messages — this stands in until those content-types exist.

const AVATAR = (seed) => `https://i.pravatar.cc/150?img=${seed}`;
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

export const initialFriends = [
  { id: 1, name: 'Nguyễn Văn A', displayName: 'Nguyễn Văn A', avatar: AVATAR(1), lastMessage: 'Chào công ty...', updatedAt: hoursAgo(0.2), unread: 2, hasUnseenAiLive: true, otpPending: true },
  { id: 2, name: 'Trần Thị B', displayName: 'Trần Thị B', avatar: AVATAR(2), lastMessage: 'Xin chào!', updatedAt: hoursAgo(1), unread: 0, hasUnseenAiLive: false, otpPending: false },
  { id: 3, name: 'Lê Văn C', displayName: 'Lê Văn C', avatar: AVATAR(3), lastMessage: 'Cảm ơn ạ', updatedAt: hoursAgo(3), unread: 0, hasUnseenAiLive: true, otpPending: false },
  { id: 4, name: 'Phạm Thị D', displayName: 'Phạm Thị D', avatar: AVATAR(4), lastMessage: 'Hẹn gặp lại', updatedAt: hoursAgo(20), unread: 0, hasUnseenAiLive: false, otpPending: false },
  { id: 5, name: 'Hoàng Văn E', displayName: 'Hoàng Văn E', avatar: AVATAR(5), lastMessage: 'abc', updatedAt: hoursAgo(30), unread: 0, hasUnseenAiLive: false, otpPending: false },
  { id: 6, name: 'Đặng Thị F', displayName: 'Đặng Thị F', avatar: AVATAR(6), lastMessage: '...', updatedAt: hoursAgo(48), unread: 0, hasUnseenAiLive: false, otpPending: false },
];

// Groups must have 3+ members to show in the Nhóm tab.
export const initialGroups = [
  { id: 101, name: 'Nhóm Dự Án A', avatar: AVATAR(11), memberIds: [1, 2, 3], ownerId: 'me', lastMessage: 'Họp lúc 3h chiều nhé', updatedAt: hoursAgo(0.5), unread: 5 },
  { id: 102, name: 'Bạn Đại Học', avatar: AVATAR(12), memberIds: [2, 4, 5, 6], ownerId: 'me', lastMessage: 'Cuối tuần đi cafe không?', updatedAt: hoursAgo(5), unread: 0 },
  { id: 103, name: 'Gia Đình', avatar: AVATAR(13), memberIds: [1, 3, 4], ownerId: 2, lastMessage: 'Ok con', updatedAt: hoursAgo(26), unread: 1 },
];

export const initialFriendRequests = [
  { id: 201, name: 'Vũ Thị G', avatar: AVATAR(21) },
  { id: 202, name: 'Bùi Văn H', avatar: AVATAR(22) },
];

export const initialGroupInvites = [
  { id: 301, name: 'Nhóm Freelancer', avatar: AVATAR(31) },
];
