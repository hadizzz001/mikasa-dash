'use client';

import { useState, useEffect } from 'react';
import Upload from '../components/Upload';

const ManageSalesBanner = () => {
  const [imgMobile, setImgMobile] = useState([]);
  const [imgPc, setImgPc] = useState([]);
  const [percentage, setPercentage] = useState('');
  const [message, setMessage] = useState('');

  // Fixed ID
  const bannerId = '699f557b514e4a80f6c81a6b';

  // Fetch current banner to show
  const [banner, setBanner] = useState(null);

  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/banner3', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((b) => b.id === bannerId);
        setBanner(found);
        if (found) setPercentage(found.percentage ?? '');
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
  const handleMobileImgChange = (url) => {
    if (url) setImgMobile(url);
  };

  const handlePcImgChange = (url) => {
    if (url) setImgPc(url);
  };

  // Submit patch update for this specific ID
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Only overwrite a side if a new image was uploaded; otherwise keep the existing one
    const finalMobile = imgMobile.length > 0 ? imgMobile : (banner?.imgMobile || []);
    const finalPc = imgPc.length > 0 ? imgPc : (banner?.imgPc || []);

    try {
      const res = await fetch(`/api/banner3?id=${bannerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ img: [], imgMobile: finalMobile, imgPc: finalPc, percentage }),
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
      <h1 className="text-2xl font-bold mb-6">Update Sales Banner</h1>

      <form onSubmit={handleEditSubmit} className="space-y-8">
        {/* Mobile Upload */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-1">📱 Mobile Banner</h2>
          <p className="text-sm text-gray-500 mb-3">Recommended size: 400 × 800 px</p>
          <Upload onFilesUpload={handleMobileImgChange} />
        </div>

        {/* PC Upload */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-1">🖥️ PC Banner</h2>
          <p className="text-sm text-gray-500 mb-3">Recommended size: 1500 × 700 px</p>
          <Upload onFilesUpload={handlePcImgChange} />
        </div>

        {/* Percentage */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-1">Percentage</h2>
          <p className="text-sm text-gray-500 mb-3">Numbers only</p>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="e.g. 20"
            className="w-full border p-2 rounded"
          />
        </div>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Update Banner
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}

      {banner && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold mb-2">Current Banners</h2>

          {/* Current Mobile Banner */}
          <div>
            <h3 className="font-semibold mb-1">📱 Mobile Banner</h3>
            {banner.imgMobile && banner.imgMobile.length > 0 ? (
              renderMedia(banner.imgMobile[0], 'Mobile Banner', 'w-32 h-auto border')
            ) : (
              <p className="text-gray-400 text-sm">No mobile banner uploaded.</p>
            )}
          </div>

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

export default ManageSalesBanner;
