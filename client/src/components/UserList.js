import React from 'react';

const UserList = ({ users, selectedUser, onSelectUser }) => {
  return (
    <div>
      {users.map(user => (
        <div
          key={user.id}
          onClick={() => onSelectUser(user)}
          style={{
            padding: 10,
            cursor: 'pointer',
            backgroundColor: selectedUser?.id === user.id ? '#e0e0e0' : 'transparent',
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          {user.username}
          <span style={{ marginLeft: 10, color: user.online ? 'green' : 'gray' }}>
            {user.online ? '●' : '○'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default UserList;

