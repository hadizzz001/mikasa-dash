'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Upload from '../components/Upload';
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

const AboutPage = () => {
  const [description, setDescription] = useState('');
  const [img, setImg] = useState<string[]>([]);
  const [existingImg, setExistingImg] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing about content on mount
  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await fetch('/api/about', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.description) setDescription(data.description);
            if (data.img) setExistingImg(data.img);
          }
        }
      } catch (error) {
        console.error('Error fetching about:', error);
      }
    };
    fetchAbout();
  }, []);

  const handleImgChange = (url: string[]) => {
    if (url) setImg(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Keep the existing image if no new one was uploaded
    const finalImg = img.length > 0 ? img : existingImg;

    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, img: finalImg }),
      });

      if (res.ok) {
        setMessage('About saved successfully!');
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
      <h2>About</h2>
      <p style={{ color: 'gray', marginBottom: '20px' }}>
        Set the About content (description and image) displayed to users.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Image */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Image
          </label>
          {existingImg.length > 0 && (
            <img
              src={existingImg[0]}
              alt="About"
              style={{ width: '200px', height: 'auto', border: '1px solid #ccc', borderRadius: '5px', marginBottom: '10px' }}
            />
          )}
          <Upload onFilesUpload={handleImgChange} />
        </div>

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
            style={{ height: '250px', marginBottom: '20px' }}
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

export default AboutPage;
