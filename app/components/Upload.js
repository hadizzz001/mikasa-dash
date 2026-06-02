'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, url }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {url.match(/\.(mp4|webm|ogg)$/i) ? (
        <video controls className="w-24 h-auto">
          <source src={url} type="video/mp4" />
        </video>
      ) : (
        <img src={url} alt="Uploaded" className="w-24 h-auto object-cover" />
      )}
    </div>
  );
};

const Upload = ({ onFilesUpload }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleFilesChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxAllowed = 12;
    const remainingSlots = maxAllowed - media.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setLoading(true);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      const isVideo = file.type.startsWith('video/');
      const uploadUrl = isVideo
        ? 'https://api.cloudinary.com/v1_1/dh2c4clxo/video/upload'
        : 'https://api.cloudinary.com/v1_1/dh2c4clxo/image/upload';

      try {
        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        if (!res.ok) continue;
        const data = await res.json();
        setMedia((prev) => {
          const newMedia = [...prev, data.secure_url];
          if (onFilesUpload) onFilesUpload(newMedia);
          return newMedia;
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setLoading(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = media.findIndex((item) => item === active.id);
      const newIndex = media.findIndex((item) => item === over.id);
      const newMedia = arrayMove(media, oldIndex, newIndex);
      setMedia(newMedia);
      if (onFilesUpload) onFilesUpload(newMedia);
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-bold">Upload Images/Videos</label>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFilesChange}
        className="border p-2 w-full mb-2"
      />
      {loading && <p>Uploading...</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={media} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-2">
            {media.map((url) => (
              <SortableItem key={url} id={url} url={url} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Upload;
