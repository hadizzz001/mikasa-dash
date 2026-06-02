'use client';

import { useState, useEffect } from 'react';
import Upload from '../components/Upload';

const ManageCategory = () => {
  const [img, setImg] = useState([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState(null); // Only one banner (with fixed ID)
  const [editMode, setEditMode] = useState(false);

  const bannerId = '699f557b514e4a80f6c81a6a';

  // Fetch that specific banner
  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/banner2', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const matched = data.find((item) => item.id === bannerId);
        setCategory(matched);
        if (matched) setImg(matched.img);
      } else {
        console.error('Failed to fetch banners');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  // Update image via PATCH
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/banner2?id=${encodeURIComponent(bannerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ img }),
      });

      if (res.ok) {
        setMessage('Banner updated successfully!');
        fetchBanner();
        window.location.reload();
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while updating the banner.');
    }
  };

  const handleImgChange = (url) => {
    if (url) setImg(url);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Manage Banner</h1>

      {category ? (
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            {category.img && category.img.length > 0 && (
              <>
                {/\.(mp4|webm|ogg)$/i.test(category.img[0]) ? (
                  <video controls className="w-40 h-auto">
                    <source src={category.img[0]} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img src={category.img[0]} alt="Banner" className="w-40 h-auto" />
                )}
              </>
            )}
          </div>

          <Upload onFilesUpload={handleImgChange} />

          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Update Banner
          </button>

          {message && <p className="mt-2 text-center text-green-600">{message}</p>}
        </form>
      ) : (
        <p className="text-center mt-8">No banner found with this ID.</p>
      )}
    </div>
  );
};

export default ManageCategory;
