import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const MessageInput = ({ onSend, onSendFile, selectedUser }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0 && selectedUser) {
      onSendFile(acceptedFiles[0], selectedUser.id);
    }
  }, [onSendFile, selectedUser]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxFiles: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && selectedUser) {
      onSendFile(file, selectedUser.id);
    }
    e.target.value = '';
  };

  return (
    <div {...getRootProps()} style={{ border: isDragActive ? '2px dashed #4caf50' : 'none' }}>
      <form onSubmit={handleSubmit} style={{ padding: 10, borderTop: '1px solid #ccc', display: 'flex' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Введите сообщение..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Отправить</button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <button type="button" onClick={() => fileInputRef.current.click()} style={{ padding: 8 }}>
          📎
        </button>
      </form>
      {isDragActive && (
        <div style={{ textAlign: 'center', padding: 10, background: '#e8f5e8' }}>
          Отпустите файл, чтобы отправить
        </div>
      )}
    </div>
  );
};

export default MessageInput;
