'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// React Quill must be loaded client-side only (it accesses `document`)
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const PrivacyPage = () => {
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing privacy content on mount
  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const res = await fetch('/api/privacy', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.description) {
            setDescription(data.description);
          }
        }
      } catch (error) {
        console.error('Error fetching privacy:', error);
      }
    };
    fetchPrivacy();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (res.ok) {
        setMessage('Privacy saved successfully!');
        window.location.reload();
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Privacy Policy</h2>
      <p style={{ color: 'gray', marginBottom: '20px' }}>
        Set the Privacy Policy content displayed to users.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Description (React Quill) */}
        <div style={{ marginBottom: '60px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description
          </label>
          <ReactQuill
            theme="snow"
            value={description}
            onChange={setDescription}
            modules={quillModules}
            style={{ height: '300px', marginBottom: '20px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#343a40',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: '15px',
            color: message.startsWith('Error') ? 'red' : 'green',
            fontWeight: 'bold',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default PrivacyPage;
