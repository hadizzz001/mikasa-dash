'use client';

import { useState, useEffect } from 'react';

const ManageColors = () => {
  const [formData, setFormData] = useState({ name: '', code: '#000000', img: '' });
  const [editFormData, setEditFormData] = useState({ id: '', name: '', code: '#000000', img: '' });
  const [message, setMessage] = useState('');
  const [colors, setColors] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  // Upload image to Cloudinary
  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'ml_default');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dh2c4clxo/image/upload', { method: 'POST', body: fd });
      if (!res.ok) return null;
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  // Fetch all colors
  const fetchColors = async () => {
    try {
      const res = await fetch('/api/color', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setColors(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  // Add color
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/color', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, img: formData.img ? [formData.img] : [] }),
    });

    if (res.ok) {
      setMessage('Color added successfully!');
      setFormData({ name: '', code: '#000000', img: '' });
      fetchColors();
    } else {
      const errorData = await res.json();
      setMessage(`Error: ${errorData.error}`);
    }
  };

  // Edit color
  const handleEdit = (color) => {
    setEditMode(true);
    setEditFormData({ id: color.id, name: color.name, code: color.code, img: (color.img && color.img[0]) || '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/color?id=${encodeURIComponent(editFormData.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFormData.name, code: editFormData.code, img: editFormData.img ? [editFormData.img] : [] }),
      });

      if (res.ok) {
        setEditFormData({ id: '', name: '', code: '#000000', img: '' });
        setEditMode(false);
        fetchColors();
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while updating the color.');
    }
  };

  // Delete color
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this color?')) {
      try {
        const res = await fetch(`/api/color?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          setMessage('Color deleted successfully!');
          fetchColors();
        } else {
          const errorData = await res.json();
          setMessage(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  // Save sorts
  const handleSaveAllSorts = async () => {
    try {
      for (const { id, sort } of colors) {
        if (sort !== undefined && sort !== null) {
          await fetch(`/api/color?id=${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: colors.find(c => c.id === id)?.name, code: colors.find(c => c.id === id)?.code, img: colors.find(c => c.id === id)?.img, sort: Number(sort) }),
          });
        }
      }
      alert('✅ All sort values saved!');
      fetchColors();
    } catch (error) {
      console.error('Error saving sorts:', error);
      alert('❌ Failed to save sort values');
    }
  };

  return (
    <div className="container mx-auto p-4 text-[13px]">
      <h1 className="text-2xl font-bold mb-4">{editMode ? 'Edit Color' : 'Add Color'}</h1>

      {/* ADD / EDIT FORM */}
      <form onSubmit={editMode ? handleEditSubmit : handleSubmit} className="mb-8 space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Color Name</label>
            <input
              type="text"
              placeholder="e.g. Red, Blue, Black"
              value={editMode ? editFormData.name : formData.name}
              onChange={(e) =>
                editMode
                  ? setEditFormData({ ...editFormData, name: e.target.value })
                  : setFormData({ ...formData, name: e.target.value })
              }
              required
              className="border p-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color Picker</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={editMode ? editFormData.code : formData.code}
                onChange={(e) =>
                  editMode
                    ? setEditFormData({ ...editFormData, code: e.target.value })
                    : setFormData({ ...formData, code: e.target.value })
                }
                className="w-12 h-10 border cursor-pointer rounded"
              />
              <input
                type="text"
                value={editMode ? editFormData.code : formData.code}
                onChange={(e) =>
                  editMode
                    ? setEditFormData({ ...editFormData, code: e.target.value })
                    : setFormData({ ...formData, code: e.target.value })
                }
                className="border p-2 w-28 text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        {/* Custom Color Image Upload (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-1">Custom Color Image (optional)</label>
          <div className="flex items-center gap-3">
            {(editMode ? editFormData.img : formData.img) && (
              <div className="relative">
                <img src={editMode ? editFormData.img : formData.img} alt="Color" className="w-14 h-14 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => editMode ? setEditFormData({ ...editFormData, img: '' }) : setFormData({ ...formData, img: '' })}
                  className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                >✕</button>
              </div>
            )}
            <label className={`cursor-pointer bg-gray-200 hover:bg-gray-300 text-sm px-3 py-2 rounded ${(editMode ? editUploading : uploading) ? 'opacity-50 pointer-events-none' : ''}`}>
              {(editMode ? editUploading : uploading) ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (editMode) {
                    setEditUploading(true);
                    const url = await uploadImage(file);
                    if (url) setEditFormData(prev => ({ ...prev, img: url }));
                    setEditUploading(false);
                  } else {
                    setUploading(true);
                    const url = await uploadImage(file);
                    if (url) setFormData(prev => ({ ...prev, img: url }));
                    setUploading(false);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            {editMode ? 'Update Color' : 'Add Color'}
          </button>
          {editMode && (
            <button
              type="button"
              onClick={() => { setEditMode(false); setEditFormData({ id: '', name: '', code: '#000000', img: '' }); }}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* SORT SAVE BUTTON */}
      <div className="mb-4 flex justify-end">
        <button onClick={handleSaveAllSorts} className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Sorts
        </button>
      </div>

      {/* COLORS TABLE */}
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Preview</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Code</th>
            <th className="border p-2 text-left">Image</th>
            <th className="border p-2 text-left">Sort</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((color) => (
            <tr key={color.id}>
              <td className="border p-2">
                <div
                  style={{ backgroundColor: color.code }}
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
              </td>
              <td className="border p-2 font-medium">{color.name}</td>
              <td className="border p-2 font-mono text-sm">{color.code}</td>
              <td className="border p-2">
                {color.img && color.img.length > 0 && color.img[0] ? (
                  <img src={color.img[0]} alt={color.name} className="w-10 h-10 object-cover rounded border" />
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>
              <td className="border p-2 w-20">
                <input
                  type="number"
                  value={color.sort || ''}
                  onChange={(e) => {
                    const updated = [...colors];
                    const idx = updated.findIndex((c) => c.id === color.id);
                    updated[idx].sort = e.target.value;
                    setColors(updated);
                  }}
                  className="border p-1 w-full text-center"
                />
              </td>
              <td className="border p-2">
                <button onClick={() => handleEdit(color)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">
                  Edit
                </button>
                <button onClick={() => handleDelete(color.id)} className="bg-red-500 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
};

export default ManageColors;
