'use client';

import { useState, useEffect } from 'react';
import Upload from '../components/Upload';

// The four sections managed on this page. Only section 4 has a URL field.
const SECTIONS = [
  { key: 'section1', title: 'Section 1', hasUrl: false, hasValue: true },
  { key: 'section2', title: 'Section 2', hasUrl: false, hasValue: false },
  { key: 'section3', title: 'Section 3', hasUrl: false, hasValue: false },
  { key: 'section4', title: 'Section 4', hasUrl: true, hasValue: false },
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

function SectionCard({ section, config, onUpdated }) {
  const [img, setImg] = useState([]);
  const [title, setTitle] = useState(section?.title ?? '');
  const [description, setDescription] = useState(section?.description ?? '');
  const [value, setValue] = useState(section?.value ?? '');
  const [url, setUrl] = useState(section?.url ?? '');
  const [message, setMessage] = useState('');

  const handleImgChange = (urls) => {
    if (urls) setImg(urls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Keep the existing image if no new one was uploaded
    const finalImg = img.length > 0 ? img : (section?.img || []);

    try {
      const res = await fetch(`/api/sections?id=${encodeURIComponent(section.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          img: finalImg,
          title,
          description: config.hasValue ? null : description,
          value: config.hasValue ? value : null,
          url: config.hasUrl ? url : null,
        }),
      });

      if (res.ok) {
        setMessage('Section updated successfully!');
        onUpdated();
        window.location.reload();
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while updating the section.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <h2 className="text-lg font-semibold">{config.title}</h2>

      {/* Current image */}
      {section?.img && section.img.length > 0 ? (
        renderMedia(section.img[0], config.title, 'w-40 h-auto border rounded')
      ) : (
        <p className="text-gray-400 text-sm">No image uploaded.</p>
      )}

      {/* Upload */}
      <Upload onFilesUpload={handleImgChange} />

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title"
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Value (number only) or Description */}
      {config.hasValue ? (
        <div>
          <label className="block text-sm font-medium mb-1">Value</label>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Numbers only"
            className="w-full border p-2 rounded"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Section description"
            rows={3}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      {/* URL (section 4 only) */}
      {config.hasUrl && (
        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Update Section
      </button>

      {message && <p className="text-sm text-green-600">{message}</p>}
    </form>
  );
}

const ManageSections = () => {
  const [sections, setSections] = useState([]);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/sections', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      } else {
        console.error('Failed to fetch sections');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">4 Sections</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map((config) => {
          const section = sections.find((s) => s.key === config.key);
          if (!section) {
            return (
              <div key={config.key} className="border rounded-lg p-4 bg-gray-50">
                <h2 className="text-lg font-semibold">{config.title}</h2>
                <p className="text-gray-400 text-sm mt-2">Section not found.</p>
              </div>
            );
          }
          return (
            <SectionCard
              key={config.key}
              section={section}
              config={config}
              onUpdated={fetchSections}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ManageSections;
