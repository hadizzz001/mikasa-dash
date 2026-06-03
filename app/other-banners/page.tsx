'use client';

import { useState, useEffect } from 'react';
import Upload from '../components/Upload';

// The three banners managed on this page
const BANNERS = [
  { key: 'bestSeller', title: 'Best Seller Banner', hasPercentage: false },
  { key: 'newArrival', title: 'New Arrival Banner', hasPercentage: false },
  { key: 'offer', title: 'Offer Banner', hasPercentage: true },
];

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

function BannerCard({ banner, config, onUpdated }) {
  const [img, setImg] = useState([]);
  const [percentage, setPercentage] = useState(banner?.percentage ?? '');
  const [message, setMessage] = useState('');

  const handleImgChange = (url) => {
    if (url) setImg(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Keep the existing image if no new one was uploaded
    const finalImg = img.length > 0 ? img : (banner?.img || []);

    try {
      const res = await fetch(`/api/other-banner?id=${encodeURIComponent(banner.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          img: finalImg,
          percentage: config.hasPercentage ? percentage : null,
        }),
      });

      if (res.ok) {
        setMessage('Banner updated successfully!');
        onUpdated();
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

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <h2 className="text-lg font-semibold">{config.title}</h2>

      {/* Current image */}
      {banner?.img && banner.img.length > 0 ? (
        renderMedia(banner.img[0], config.title, 'w-40 h-auto border rounded')
      ) : (
        <p className="text-gray-400 text-sm">No image uploaded.</p>
      )}

      {/* Upload */}
      <Upload onFilesUpload={handleImgChange} />

      {/* Percentage (offer banner only) */}
      {config.hasPercentage && (
        <div>
          <label className="block text-sm font-medium mb-1">Percentage</label>
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
      )}

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Update Banner
      </button>

      {message && <p className="text-sm text-green-600">{message}</p>}
    </form>
  );
}

const ManageOtherBanners = () => {
  const [banners, setBanners] = useState([]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/other-banner', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      } else {
        console.error('Failed to fetch banners');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Other Banners</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BANNERS.map((config) => {
          const banner = banners.find((b) => b.key === config.key);
          if (!banner) {
            return (
              <div key={config.key} className="border rounded-lg p-4 bg-gray-50">
                <h2 className="text-lg font-semibold">{config.title}</h2>
                <p className="text-gray-400 text-sm mt-2">Banner not found.</p>
              </div>
            );
          }
          return (
            <BannerCard
              key={config.key}
              banner={banner}
              config={config}
              onUpdated={fetchBanners}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ManageOtherBanners;
