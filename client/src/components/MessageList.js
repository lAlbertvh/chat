import React, { useRef, useEffect } from 'react';

const MessageList = ({ messages, currentUserId }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            textAlign: msg.senderId === currentUserId ? 'right' : 'left',
            margin: '5px 0'
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '5px 10px',
              borderRadius: 5,
              backgroundColor: msg.senderId === currentUserId ? '#dcf8c6' : '#f1f1f1'
            }}
          >
            <strong>{msg.sender?.username || '??'}:</strong>{' '}
            {msg.type === 'file' ? (
              <a href={`http://localhost:3000${msg.content}`} target="_blank" rel="noopener noreferrer">
                📎 Скачать файл
              </a>
            ) : (
              <span>{msg.content}</span>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
