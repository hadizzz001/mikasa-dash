'use client';

import { useState, useEffect } from 'react';
import Upload from '../components/Upload';

const ManageBanner = () => {
  const [imgPc, setImgPc] = useState([]);
  const [message, setMessage] = useState('');

  // Fixed ID
  const bannerId = '699f557b514e4a80f6c81a68';

  // Fetch current banner to show
  const [banner, setBanner] = useState(null);

  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/banner', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((b) => b.id === bannerId);
        setBanner(found);
      } else {
        console.error('Failed to fetch banner');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  // Handle image changes
  const handlePcImgChange = (url) => {
    if (url) setImgPc(url);
  };

  // Submit patch update for this specific ID
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/banner?id=${bannerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ img: [], imgPc }),
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

  const renderMedia = (src, alt, className) => {
    if (/\.(mp4|webm|ogg)$/i.test(src)) {
      return (
        <video controls className={className}>
          <source src={src} type="video/mp4" />
        </video>
      );
    }
    return <img src={src} alt={alt} className={className} />;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Update Banner</h1>

      <form onSubmit={handleEditSubmit} className="space-y-8">
        {/* PC Upload */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-1">🖥️ PC Banner</h2>
          <Upload onFilesUpload={handlePcImgChange} />
        </div>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Update Banner
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}

      {banner && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold mb-2">Current Banners</h2>

          {/* Current PC Banner */}
          <div>
            <h3 className="font-semibold mb-1">🖥️ PC Banner</h3>
            {banner.imgPc && banner.imgPc.length > 0 ? (
              renderMedia(banner.imgPc[0], 'PC Banner', 'w-64 h-auto border')
            ) : (
              <p className="text-gray-400 text-sm">No PC banner uploaded.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBanner;
