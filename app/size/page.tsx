'use client';

import { useState, useEffect } from 'react';

const ManageSizes = () => {
  const [formData, setFormData] = useState({ name: '' });
  const [editFormData, setEditFormData] = useState({ id: '', name: '' });
  const [message, setMessage] = useState('');
  const [sizes, setSizes] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // Fetch all sizes
  const fetchSizes = async () => {
    try {
      const res = await fetch('/api/size', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setSizes(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  // Add size
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/size', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setMessage('Size added successfully!');
      setFormData({ name: '' });
      fetchSizes();
    } else {
      const errorData = await res.json();
      setMessage(`Error: ${errorData.error}`);
    }
  };

  // Edit size
  const handleEdit = (size) => {
    setEditMode(true);
    setEditFormData({ id: size.id, name: size.name });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/size?id=${encodeURIComponent(editFormData.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFormData.name }),
      });

      if (res.ok) {
        setEditFormData({ id: '', name: '' });
        setEditMode(false);
        fetchSizes();
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while updating the size.');
    }
  };

  // Delete size
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this size?')) {
      try {
        const res = await fetch(`/api/size?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          setMessage('Size deleted successfully!');
          fetchSizes();
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
      for (const { id, sort, name } of sizes) {
        if (sort !== undefined && sort !== null) {
          await fetch(`/api/size?id=${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, sort: Number(sort) }),
          });
        }
      }
      alert('✅ All sort values saved!');
      fetchSizes();
    } catch (error) {
      console.error('Error saving sorts:', error);
      alert('❌ Failed to save sort values');
    }
  };

  return (
    <div className="container mx-auto p-4 text-[13px]">
      <h1 className="text-2xl font-bold mb-4">{editMode ? 'Edit Size' : 'Add Size'}</h1>

      {/* ADD / EDIT FORM */}
      <form onSubmit={editMode ? handleEditSubmit : handleSubmit} className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Size name (e.g. S, M, L, XL, 42, 44)"
          value={editMode ? editFormData.name : formData.name}
          onChange={(e) =>
            editMode
              ? setEditFormData({ ...editFormData, name: e.target.value })
              : setFormData({ ...formData, name: e.target.value })
          }
          required
          className="border p-2 w-full"
        />

        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            {editMode ? 'Update Size' : 'Add Size'}
          </button>
          {editMode && (
            <button
              type="button"
              onClick={() => { setEditMode(false); setEditFormData({ id: '', name: '' }); }}
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

      {/* SIZES TABLE */}
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Sort</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size.id}>
              <td className="border p-2 font-medium">{size.name}</td>
              <td className="border p-2 w-20">
                <input
                  type="number"
                  value={size.sort || ''}
                  onChange={(e) => {
                    const updated = [...sizes];
                    const idx = updated.findIndex((s) => s.id === size.id);
                    updated[idx].sort = e.target.value;
                    setSizes(updated);
                  }}
                  className="border p-1 w-full text-center"
                />
              </td>
              <td className="border p-2">
                <button onClick={() => handleEdit(size)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">
                  Edit
                </button>
                <button onClick={() => handleDelete(size.id)} className="bg-red-500 text-white px-3 py-1 rounded">
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

export default ManageSizes;
