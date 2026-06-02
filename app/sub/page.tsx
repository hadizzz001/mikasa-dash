'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ManageCategory = () => {
  const [formData, setFormData] = useState({ name: '' });
  const [editFormData, setEditFormData] = useState({ id: '', name: '' });
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  // ✅ Fetch all subcategories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/sub', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch subcategories');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Add subcategory
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/sub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setMessage('Subcategory added successfully!');
      setFormData({ name: '' });
      fetchCategories();
      window.location.reload();
    } else {
      const errorData = await res.json();
      setMessage(`Error: ${errorData.error}`);
    }
  };

  // ✅ Edit subcategory
  const handleEdit = (category) => {
    setEditMode(true);
    setEditFormData({
      id: category.id,
      name: category.name,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sub?id=${encodeURIComponent(editFormData.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
        }),
      });

      if (res.ok) {
        setEditFormData({ id: '', name: '' });
        setEditMode(false);
        fetchCategories();
        window.location.reload();
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while updating the subcategory.');
    }
  };

  // ✅ Delete subcategory
  const handleDelete = async (id) => {
    if (confirm(`Are you sure you want to delete this subcategory?`)) {
      try {
        const res = await fetch(`/api/sub?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setMessage('Subcategory deleted successfully!');
          fetchCategories();
          window.location.reload();
        } else {
          const errorData = await res.json();
          setMessage(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

// ✅ Save all sort updates (PATCH each subcategory individually)
const handleSaveAllSorts = async () => {
  try {
    const updates = categories
      .filter((c) => c.id && c.sort !== undefined && c.sort !== null)
      .map(({ id, sort }) => ({ id, sort: Number(sort) }));

    if (updates.length === 0) {
      alert('No subcategories to update!');
      return;
    }

    // ✅ Loop through each and patch individually
    for (const { id, sort } of updates) {
      const res = await fetch(`/api/sub1/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error(`❌ Failed for ID ${id}: ${errorData.error}`);
      }
    }

    alert('✅ All sort values saved successfully!');
    fetchCategories();
  } catch (error) {
    console.error('Error saving sorts:', error);
    alert('❌ Failed to save sort values');
  }
};



  return (
    <div className="container mx-auto p-4 text-[13px]">
      <h1 className="text-2xl font-bold mb-4">{editMode ? 'Edit Subcategory' : 'Add Subcategory'}</h1>

      {/* ✅ ADD / EDIT FORM */}
      <form onSubmit={editMode ? handleEditSubmit : handleSubmit} className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Subcategory Name"
          value={editMode ? editFormData.name : formData.name}
          onChange={(e) =>
            editMode
              ? setEditFormData({ ...editFormData, name: e.target.value })
              : setFormData({ ...formData, name: e.target.value })
          }
          required
          className="border p-2 w-full"
        />

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          {editMode ? 'Update Subcategory' : 'Add Subcategory'}
        </button>
        {editMode && (
          <button
            type="button"
            onClick={() => {
              setEditMode(false);
              setEditFormData({ id: '', name: '' });
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
          >
            Cancel
          </button>
        )}
      </form>

      {/* ✅ SORT SAVE BUTTON */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleSaveAllSorts}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Sorts
        </button>
      </div>

      {/* ✅ SUBCATEGORY TABLE */}
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Sort</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td className="border p-2">{category.name}</td>

              {/* ✅ SORT FIELD */}
              <td className="border p-2 w-20">
                <input
                  type="number"
                  value={category.sort || ''}
                  onChange={(e) => {
                    const updated = [...categories];
                    const index = updated.findIndex((c) => c.id === category.id);
                    updated[index].sort = e.target.value;
                    setCategories(updated);
                  }}
                  className="border p-1 w-full text-center"
                />
              </td>

              <td className="border p-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
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

export default ManageCategory;
