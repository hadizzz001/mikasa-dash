"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import Upload from '../components/Upload';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Sortable image/video thumbnail for drag reorder
function SortableImageItem({ id, url, onRemove }: { id: string; url: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} className="relative" {...attributes} {...listeners}>
      {/\.(mp4|webm|ogg)$/i.test(url) ? (
        <video src={url} className="w-20 h-20 object-cover rounded border" />
      ) : (
        <img src={url} alt="" className="w-20 h-20 object-cover rounded border" />
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
      >✕</button>
    </div>
  );
}

// Types for variant system
interface SizeEntry {
  size: string;
  qty: string;
  price: string;
  percentage: string; // discount percentage (optional)
  discount: string;   // calculated final price after percentage (read-only)
}

interface ColorVariant {
  color: string;
  colorCode: string;
  colorImg: string;
  images: string[];
  sizes: SizeEntry[];
}

interface DBColor {
  id: string;
  name: string;
  code: string;
  img: string[];
}

interface DBSize {
  id: string;
  name: string;
}

interface SpecItem {
  title: string;
  value: string;
}

interface SpecGroup {
  title: string;
  items: SpecItem[];
}

export default function AddProduct() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockEnabled, setStockEnabled] = useState(false);
  const [img, setImg] = useState(['']);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [factoryOptions, setFactoryOptions] = useState([]);
  // an item can belong to many categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [sale, setSale] = useState(false);
  const [arrival, setArrival] = useState(false);
  const [noPrice, setNoPrice] = useState(false);
  const [productType, setProductType] = useState<'single' | 'collection'>('single');
  const [collectionMode, setCollectionMode] = useState<'sizeColor' | 'sizeOnly' | 'colorOnly'>('sizeColor');
  const [singlePrice, setSinglePrice] = useState('');
  const [singleDiscount, setSingleDiscount] = useState('');
  const [singleStock, setSingleStock] = useState('');

  // Specs state
  const [specs, setSpecs] = useState<SpecGroup[]>([]);

  // --- Spec Helper Functions ---
  const addSpecGroup = () => {
    setSpecs([...specs, { title: '', items: [{ title: '', value: '' }] }]);
  };

  const removeSpecGroup = (groupIdx: number) => {
    setSpecs(specs.filter((_, i) => i !== groupIdx));
  };

  const updateSpecGroupTitle = (groupIdx: number, title: string) => {
    const updated = [...specs];
    updated[groupIdx].title = title;
    setSpecs(updated);
  };

  const addSpecItem = (groupIdx: number) => {
    const updated = [...specs];
    updated[groupIdx].items.push({ title: '', value: '' });
    setSpecs(updated);
  };

  const removeSpecItem = (groupIdx: number, itemIdx: number) => {
    const updated = [...specs];
    updated[groupIdx].items = updated[groupIdx].items.filter((_, i) => i !== itemIdx);
    setSpecs(updated);
  };

  const updateSpecItem = (groupIdx: number, itemIdx: number, field: 'title' | 'value', val: string) => {
    const updated = [...specs];
    updated[groupIdx].items[itemIdx][field] = val;
    setSpecs(updated);
  };

  // DB-driven color & size options
  const [dbColors, setDbColors] = useState<DBColor[]>([]);
  const [dbSizes, setDbSizes] = useState<DBSize[]>([]);

  // Color/Size Variant State
  const [variants, setVariants] = useState<ColorVariant[]>([
    { color: '', colorCode: '', colorImg: '', images: [], sizes: [{ size: '', qty: '', price: '', percentage: '', discount: '' }] }
  ]);

  // --- Variant Helper Functions ---
  const addColor = () => {
    setVariants([...variants, { color: '', colorCode: '', colorImg: '', images: [], sizes: [{ size: '', qty: '', price: '', percentage: '', discount: '' }] }]);
  };

  const removeColor = (colorIdx: number) => {
    setVariants(variants.filter((_, i) => i !== colorIdx));
  };

  // Toggle a category on/off (an item can belong to many categories)
  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  // Switch between collection modes (sizeColor | sizeOnly | colorOnly)
  const changeCollectionMode = (mode: 'sizeColor' | 'sizeOnly' | 'colorOnly') => {
    setCollectionMode(mode);
    setVariants(prev => {
      if (mode === 'sizeOnly') {
        const base = prev[0] || { color: '', colorCode: '', colorImg: '', images: [], sizes: [] };
        return [{
          color: '', colorCode: '', colorImg: '',
          images: base.images || [],
          sizes: base.sizes && base.sizes.length
            ? base.sizes
            : [{ size: '', qty: '', price: '', percentage: '', discount: '' }],
        }];
      }
      if (mode === 'colorOnly') {
        return prev.map(v => ({
          ...v,
          sizes: [v.sizes?.[0] || { size: '', qty: '', price: '', percentage: '', discount: '' }],
        }));
      }
      // sizeColor
      return prev.length
        ? prev
        : [{ color: '', colorCode: '', colorImg: '', images: [], sizes: [{ size: '', qty: '', price: '', percentage: '', discount: '' }] }];
    });
  };

  const selectColor = (colorIdx: number, colorName: string) => {
    if (variants.some((v, i) => i !== colorIdx && v.color === colorName)) {
      alert(`Color "${colorName}" is already added.`);
      return;
    }
    const updated = [...variants];
    const dbColor = dbColors.find(c => c.name === colorName);
    updated[colorIdx].color = colorName;
    updated[colorIdx].colorCode = dbColor?.code || '';
    updated[colorIdx].colorImg = (dbColor?.img && dbColor.img[0]) || '';
    setVariants(updated);
  };

  // --- Cloudinary Upload Helper ---
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'ml_default');
    const isVideo = file.type.startsWith('video/');
    const url = isVideo
      ? 'https://api.cloudinary.com/v1_1/tynkb5kn/video/upload'
      : 'https://api.cloudinary.com/v1_1/tynkb5kn/image/upload';
    try {
      const res = await fetch(url, { method: 'POST', body: fd });
      if (!res.ok) return null;
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  // Upload product images for a specific color
  const handleColorImagesUpload = async (colorIdx: number, files: FileList) => {
    const maxAllowed = 12;
    const current = variants[colorIdx].images.length;
    const remaining = maxAllowed - current;
    const filesToUpload = Array.from(files).slice(0, remaining);
    for (const file of filesToUpload) {
      const url = await uploadToCloudinary(file);
      if (url) {
        setVariants(prev => {
          const updated = [...prev];
          updated[colorIdx] = { ...updated[colorIdx], images: [...updated[colorIdx].images, url] };
          return updated;
        });
      }
    }
  };

  // Remove a product image from a color
  const removeColorImage = (colorIdx: number, imgIdx: number) => {
    const updated = [...variants];
    updated[colorIdx].images = updated[colorIdx].images.filter((_, i) => i !== imgIdx);
    setVariants(updated);
  };

  // Drag reorder for per-color product images
  const dndSensors = useSensors(useSensor(PointerSensor));
  const handleColorImageDragEnd = (colorIdx: number, event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setVariants(prev => {
      const updated = [...prev];
      const images = [...updated[colorIdx].images];
      const oldIndex = images.indexOf(active.id);
      const newIndex = images.indexOf(over.id);
      updated[colorIdx] = { ...updated[colorIdx], images: arrayMove(images, oldIndex, newIndex) };
      return updated;
    });
  };

  // Upload custom color swatch image override
  const handleColorImgOverride = async (colorIdx: number, file: File) => {
    const url = await uploadToCloudinary(file);
    if (url) {
      const updated = [...variants];
      updated[colorIdx].colorImg = url;
      setVariants(updated);
    }
  };

  const addSize = (colorIdx: number) => {
    const updated = [...variants];
    updated[colorIdx].sizes.push({ size: '', qty: '', price: '', percentage: '', discount: '' });
    setVariants(updated);
  };

  const removeSize = (colorIdx: number, sizeIdx: number) => {
    const updated = [...variants];
    updated[colorIdx].sizes = updated[colorIdx].sizes.filter((_, i) => i !== sizeIdx);
    setVariants(updated);
  };

  const updateSize = (colorIdx: number, sizeIdx: number, field: keyof SizeEntry, value: string) => {
    if (field === 'size') {
      const alreadyUsed = variants[colorIdx].sizes.some((sz, i) => i !== sizeIdx && sz.size === value);
      if (alreadyUsed) {
        alert(`Size "${value}" is already added for this color.`);
        return;
      }
    }
    const updated = [...variants];
    updated[colorIdx].sizes[sizeIdx][field] = value;
    // Recompute discount (final price after percentage) whenever price or percentage changes
    if (field === 'price' || field === 'percentage') {
      const sz = updated[colorIdx].sizes[sizeIdx];
      const p = Number(sz.price);
      const pct = Number(sz.percentage);
      if (p > 0 && pct > 0) {
        sz.discount = (p - (p * pct / 100)).toFixed(2);
      } else {
        sz.discount = '';
      }
    }
    setVariants(updated);
  };

  // Auto-calculate pricing from variants
  const allPrices = variants.flatMap(v =>
    v.sizes.map(sz => {
      if (sz.percentage && Number(sz.percentage) > 0) {
        return Number(sz.price) - (Number(sz.price) * Number(sz.percentage) / 100);
      }
      return Number(sz.price) || 0;
    }).filter(p => p > 0)
  );
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices).toFixed(2) : '';
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices).toFixed(2) : '';









  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`/api/category`);
        if (response.ok) {
          const data = await response.json();
          setCategoryOptions(data);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`/api/factory`);
        if (response.ok) {
          const data = await response.json();
          setFactoryOptions(data);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch colors from DB
  useEffect(() => {
    async function fetchColors() {
      try {
        const response = await fetch('/api/color');
        if (response.ok) {
          const data = await response.json();
          setDbColors(data);
        }
      } catch (error) {
        console.error('Error fetching colors:', error);
      }
    }
    fetchColors();
  }, []);

  // Fetch sizes from DB
  useEffect(() => {
    async function fetchSizes() {
      try {
        const response = await fetch('/api/size');
        if (response.ok) {
          const data = await response.json();
          setDbSizes(data);
        }
      } catch (error) {
        console.error('Error fetching sizes:', error);
      }
    }
    fetchSizes();
  }, []);




  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    // Validate variants only for collection type
    if (productType === 'collection') {
      if (collectionMode === 'sizeOnly') {
        const v = variants[0];
        for (let j = 0; j < v.sizes.length; j++) {
          const sz = v.sizes[j];
          if (!sz.size.trim()) {
            alert(`Please select a size for row #${j + 1}`);
            return;
          }
          if (stockEnabled && (!sz.qty || Number(sz.qty) < 0)) {
            alert(`Please enter a valid qty for size "${sz.size}"`);
            return;
          }
          if (!noPrice && (!sz.price || Number(sz.price) <= 0)) {
            alert(`Please enter a valid price for size "${sz.size}"`);
            return;
          }
        }
      } else if (collectionMode === 'colorOnly') {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (!v.color.trim()) {
            alert(`Please select a color for variant #${i + 1}`);
            return;
          }
          const sz = v.sizes[0];
          if (stockEnabled && (!sz.qty || Number(sz.qty) < 0)) {
            alert(`Please enter a valid qty for color "${v.color}"`);
            return;
          }
          if (!noPrice && (!sz.price || Number(sz.price) <= 0)) {
            alert(`Please enter a valid price for color "${v.color}"`);
            return;
          }
        }
      } else {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (!v.color.trim()) {
            alert(`Please enter a color name for variant #${i + 1}`);
            return;
          }
          for (let j = 0; j < v.sizes.length; j++) {
            const sz = v.sizes[j];
            if (!sz.size.trim()) {
              alert(`Please enter a size name for color "${v.color}", row #${j + 1}`);
              return;
            }
            if (stockEnabled && (!sz.qty || Number(sz.qty) < 0)) {
              alert(`Please enter a valid qty for color "${v.color}", size "${sz.size}"`);
              return;
            }
            if (!noPrice && (!sz.price || Number(sz.price) <= 0)) {
              alert(`Please enter a valid price for color "${v.color}", size "${sz.size}"`);
              return;
            }
          }
        }
      }
    }

    // Build price/stock based on product type
    let computedPrice: string;
    let computedStock: string | null;
    let computedDiscount: string | null = null;
    let colorData: any = null;

    if (productType === 'collection') {
      computedPrice = minPrice || '0';
      computedStock = null;
      computedDiscount = minPrice !== maxPrice ? minPrice : null;
      colorData = variants;
    } else {
      computedPrice = singlePrice ? Number(singlePrice).toFixed(2) : '0';
      computedStock = stockEnabled ? singleStock || '0' : null;
      if (singleDiscount && Number(singleDiscount) > 0) {
        computedDiscount = (Number(singlePrice) - (Number(singlePrice) * Number(singleDiscount) / 100)).toFixed(2);
      }
    }

    // Collect all images from all color variants for the product img field
    const productImages = productType === 'collection'
      ? variants.flatMap(v => v.images)
      : img;

    const payload = {
      title,
      code,
      description,
      sale: sale ? "yes" : "no",
      arrival: arrival ? "yes" : "no",
      noprice: noPrice ? "yes" : "no",
      tax: "no",
      price: computedPrice,
      discount: computedDiscount,
      percentage:
        productType === 'single'
          ? (singleDiscount ? singleDiscount : null)
          : (() => {
              const pcts = variants.flatMap(v => v.sizes.map(sz => Number(sz.percentage) || 0)).filter(p => p > 0);
              if (pcts.length === 0) return null;
              const minP = Math.min(...pcts);
              const maxP = Math.max(...pcts);
              return minP === maxP ? String(minP) : `${minP}-${maxP}`;
            })(),
      img: productImages,
      category: selectedCategories,
      factory: selectedCategories[0] || '',
      type: productType,
      stock: computedStock,
      stockEnabled,
      color: colorData,
      collectionMode: productType === 'collection' ? collectionMode : null,
      specs: specs.length > 0 ? specs : null,
    };





    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Product added successfully!');
        window.location.reload();
      } else {
        alert('Failed to add product');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('An error occurred');
    }
  };


  // Get discounted price for a size entry
  const getDiscountedPrice = (sz: SizeEntry) => {
    if (sz.percentage && Number(sz.percentage) > 0 && sz.price && Number(sz.price) > 0) {
      return (Number(sz.price) - (Number(sz.price) * Number(sz.percentage) / 100)).toFixed(2);
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add New Product</h1>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 mb-4"
        required
      />

      <input
        type="text"
        placeholder="Item Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border p-2 mb-4"
        required
      />

      <label className="block text-lg font-bold mb-2">Category</label>
      <p className="text-sm text-gray-500 mb-2">Select one or more categories.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {factoryOptions.map((category) => {
          const isSelected = selectedCategories.includes(category.name);
          return (
            <button
              type="button"
              key={category.id}
              onClick={() => toggleCategory(category.name)}
              className={`px-3 py-2 rounded border text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {isSelected ? '✓ ' : ''}{category.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-6 my-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={sale} onChange={(e) => setSale(e.target.checked)} />
          <span>Best Seller</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={arrival} onChange={(e) => setArrival(e.target.checked)} />
          <span>New Arrival</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={noPrice} onChange={(e) => setNoPrice(e.target.checked)} />
          <span>No Price</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={stockEnabled} onChange={(e) => setStockEnabled(e.target.checked)} />
          <span>Track Stock</span>
        </label>
      </div>

      {/* ===== PRODUCT TYPE SELECTOR ===== */}
      <div className="mb-4">
        <label className="block text-lg font-bold mb-2">Product Type</label>
        <div className="flex gap-4">
          <label className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 ${productType === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <input
              type="radio"
              name="productType"
              value="single"
              checked={productType === 'single'}
              onChange={() => setProductType('single')}
            />
            <div>
              <span className="font-semibold">Single</span>
              <p className="text-xs text-gray-500">One price, optional stock</p>
            </div>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 ${productType === 'collection' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <input
              type="radio"
              name="productType"
              value="collection"
              checked={productType === 'collection'}
              onChange={() => setProductType('collection')}
            />
            <div>
              <span className="font-semibold">Collection</span>
              <p className="text-xs text-gray-500">Multiple colors &amp; sizes</p>
            </div>
          </label>
        </div>
      </div>

      {/* ===== COLLECTION TYPE SELECTOR ===== */}
      {productType === 'collection' && (
        <div className="mb-4">
          <label className="block text-lg font-bold mb-2">Collection Type</label>
          <div className="flex flex-col sm:flex-row gap-3">
            {[
              { key: 'sizeColor', label: 'Size & Color', desc: 'Colors, each with sizes' },
              { key: 'sizeOnly', label: 'Size Only', desc: 'Sizes, no colors' },
              { key: 'colorOnly', label: 'Color Only', desc: 'Colors, no sizes' },
            ].map((m) => (
              <label
                key={m.key}
                className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 ${collectionMode === m.key ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              >
                <input
                  type="radio"
                  name="collectionMode"
                  value={m.key}
                  checked={collectionMode === m.key}
                  onChange={() => changeCollectionMode(m.key as 'sizeColor' | 'sizeOnly' | 'colorOnly')}
                />
                <div>
                  <span className="font-semibold">{m.label}</span>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ===== SINGLE PRODUCT PRICE/STOCK ===== */}
      {productType === 'single' && (
        <div className="border rounded-lg p-4 mb-4 bg-gray-50">
          <h2 className="text-lg font-bold mb-3">Price{stockEnabled ? ' & Stock' : ''}</h2>
          {!noPrice && (
            <>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={singlePrice}
                onChange={(e) => setSinglePrice(e.target.value)}
                className="w-full border p-2 mb-2"
                required
              />
              <label className="block text-sm font-medium mb-1">Discount Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 10 for 10% off"
                value={singleDiscount}
                onChange={(e) => setSingleDiscount(e.target.value)}
                className="w-full border p-2 mb-2"
              />
              <label className="block text-sm font-medium mb-1">Discount (final price after % – read only)</label>
              <input
                type="text"
                readOnly
                value={
                  singlePrice && singleDiscount && Number(singleDiscount) > 0
                    ? (Number(singlePrice) - (Number(singlePrice) * Number(singleDiscount) / 100)).toFixed(2)
                    : ''
                }
                placeholder="Auto-calculated from price × (1 - %/100)"
                className="w-full border p-2 mb-2 bg-gray-100 text-green-700 font-semibold"
              />
            </>
          )}
          {stockEnabled && (
            <input
              type="number"
              placeholder="Stock"
              value={singleStock}
              min={0}
              onChange={(e) => setSingleStock(e.target.value)}
              className="w-full border p-2 mb-2"
              required
            />
          )}
        </div>
      )}

      {/* ===== COLOR / SIZE VARIANT SECTION (Collection only) ===== */}
      {productType === 'collection' && (
      <div className="border rounded-lg p-4 mb-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">
            {collectionMode === 'sizeOnly' ? 'Sizes' : collectionMode === 'colorOnly' ? 'Colors' : 'Colors & Sizes'}
          </h2>
          {collectionMode !== 'sizeOnly' && (
            <button
              type="button"
              onClick={addColor}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              + Add Color
            </button>
          )}
        </div>

        {variants.map((variant, colorIdx) => (
          <div key={colorIdx} className="border rounded-lg p-3 mb-3 bg-white">
            {/* Color Header */}
            {collectionMode !== 'sizeOnly' && (
            <div className="flex items-center gap-2 mb-3">
              {variant.colorImg ? (
                <img
                  src={variant.colorImg}
                  alt={variant.color}
                  className="w-8 h-8 rounded-full border border-gray-300 flex-shrink-0 object-cover"
                />
              ) : variant.colorCode ? (
                <div
                  style={{ backgroundColor: variant.colorCode }}
                  className="w-8 h-8 rounded-full border border-gray-300 flex-shrink-0"
                />
              ) : null}
              <select
                value={variant.color}
                onChange={(e) => selectColor(colorIdx, e.target.value)}
                className="border p-2 rounded flex-1 font-semibold"
                required
              >
                <option value="" disabled>Select a Color</option>
                {dbColors
                  .filter(c => c.name === variant.color || !variants.some(v => v.color === c.name))
                  .map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColor(colorIdx)}
                  className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                >
                  ✕ Remove Color
                </button>
              )}
            </div>
            )}

            {/* Product Images for this color */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">📷 {collectionMode === 'sizeOnly' ? 'Product Images' : 'Product Images for this color'} (max 12)</label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => { if (e.target.files) handleColorImagesUpload(colorIdx, e.target.files); e.target.value = ''; }}
                className="border p-1.5 text-sm w-full mb-2"
              />
              {variant.images.length > 0 && (
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={(e) => handleColorImageDragEnd(colorIdx, e)}>
                  <SortableContext items={variant.images} strategy={horizontalListSortingStrategy}>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {variant.images.map((imgUrl, imgIdx) => (
                        <SortableImageItem
                          key={imgUrl}
                          id={imgUrl}
                          url={imgUrl}
                          onRemove={() => removeColorImage(colorIdx, imgIdx)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Optional custom color swatch image override */}
            {collectionMode !== 'sizeOnly' && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">🎨 Custom Color Image (optional override)</label>
              <div className="flex items-center gap-3">
                {variant.colorImg && (
                  <div className="relative">
                    <img src={variant.colorImg} alt="Color" className="w-10 h-10 object-cover rounded-full border" />
                    <button
                      type="button"
                      onClick={() => { const updated = [...variants]; updated[colorIdx].colorImg = ''; setVariants(updated); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                    >✕</button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleColorImgOverride(colorIdx, f); e.target.value = ''; }}
                  className="border p-1 text-sm"
                />
              </div>
            </div>
            )}

            {/* COLOR ONLY: single price / qty for this color */}
            {collectionMode === 'colorOnly' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {stockEnabled && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Qty</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Qty"
                      value={variant.sizes[0]?.qty || ''}
                      onChange={(e) => updateSize(colorIdx, 0, 'qty', e.target.value)}
                      className="border p-1.5 rounded w-full"
                      required
                    />
                  </div>
                )}
                {!noPrice && (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={variant.sizes[0]?.price || ''}
                        onChange={(e) => updateSize(colorIdx, 0, 'price', e.target.value)}
                        className="border p-1.5 rounded w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Discount %</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="Optional"
                        value={variant.sizes[0]?.percentage || ''}
                        onChange={(e) => updateSize(colorIdx, 0, 'percentage', e.target.value)}
                        className="border p-1.5 rounded w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Final Price</label>
                      <input
                        type="text"
                        readOnly
                        value={getDiscountedPrice(variant.sizes[0]) || (variant.sizes[0]?.price ? Number(variant.sizes[0].price).toFixed(2) : '')}
                        placeholder="—"
                        className="border p-1.5 rounded w-full bg-gray-100 text-green-700 font-semibold"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Size Table */}
            {(collectionMode === 'sizeColor' || collectionMode === 'sizeOnly') && (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Size</th>
                    {stockEnabled && <th className="text-left p-2 border">Qty</th>}
                    {!noPrice && <th className="text-left p-2 border">Price</th>}
                    {!noPrice && <th className="text-left p-2 border">Discount %</th>}
                    {!noPrice && <th className="text-left p-2 border">Final Price</th>}
                    <th className="text-center p-2 border w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variant.sizes.map((sz, sizeIdx) => {
                    const discountedPrice = getDiscountedPrice(sz);
                    return (
                      <tr key={sizeIdx} className="border-b">
                        <td className="p-1 border">
                          <select
                            value={sz.size}
                            onChange={(e) => updateSize(colorIdx, sizeIdx, 'size', e.target.value)}
                            className="border p-1.5 rounded w-full"
                            required
                          >
                            <option value="" disabled>Select Size</option>
                            {dbSizes
                              .filter(s => s.name === sz.size || !variant.sizes.some(existingSz => existingSz.size === s.name))
                              .map((s) => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        {stockEnabled && (
                          <td className="p-1 border">
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              value={sz.qty}
                              onChange={(e) => updateSize(colorIdx, sizeIdx, 'qty', e.target.value)}
                              className="border p-1.5 rounded w-full"
                              required
                            />
                          </td>
                        )}
                        {!noPrice && (
                          <td className="p-1 border">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Price"
                              value={sz.price}
                              onChange={(e) => updateSize(colorIdx, sizeIdx, 'price', e.target.value)}
                              className="border p-1.5 rounded w-full"
                              required
                            />
                          </td>
                        )}
                        {!noPrice && (
                          <td className="p-1 border">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="Optional"
                              value={sz.percentage}
                              onChange={(e) => updateSize(colorIdx, sizeIdx, 'percentage', e.target.value)}
                              className="border p-1.5 rounded w-full"
                            />
                          </td>
                        )}
                        {!noPrice && (
                          <td className="p-1 border text-center">
                            <input
                              type="text"
                              readOnly
                              value={
                                discountedPrice
                                  ? discountedPrice
                                  : sz.price
                                  ? Number(sz.price).toFixed(2)
                                  : ''
                              }
                              placeholder="—"
                              className="border p-1.5 rounded w-full bg-gray-100 text-green-700 font-semibold text-center"
                              title="Final price = price × (1 - discount%/100)"
                            />
                          </td>
                        )}
                        <td className="p-1 border text-center">
                          {variant.sizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSize(colorIdx, sizeIdx)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => addSize(colorIdx)}
              className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              + Add Size
            </button>
            </>
            )}
          </div>
        ))}

        {/* Summary */}
        {!noPrice && minPrice && (
          <div className="flex gap-6 mt-3 text-sm font-medium bg-white border rounded p-3">
            <span>
              Price Range:{' '}
              <strong className="text-green-600">
                {minPrice === maxPrice ? minPrice : `${minPrice} – ${maxPrice}`}
              </strong>
            </span>
          </div>
        )}
      </div>
      )}
      {/* ===== END VARIANT SECTION ===== */}

      {/* ===== SPECS SECTION ===== */}
      <div className="border rounded-lg p-4 mb-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Specifications</h2>
          <button
            type="button"
            onClick={addSpecGroup}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            + Add Spec Group
          </button>
        </div>

        {specs.length === 0 && (
          <p className="text-gray-400 text-sm">No specifications added yet. Click "+ Add Spec Group" to start.</p>
        )}

        {specs.map((group, groupIdx) => (
          <div key={groupIdx} className="border rounded-lg p-3 mb-3 bg-white">
            {/* Group Title */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Spec group title (e.g. General, Display, Battery)"
                value={group.title}
                onChange={(e) => updateSpecGroupTitle(groupIdx, e.target.value)}
                className="border p-2 rounded flex-1 font-semibold"
              />
              <button
                type="button"
                onClick={() => removeSpecGroup(groupIdx)}
                className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
              >
                ✕ Remove
              </button>
            </div>

            {/* Spec Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Title</th>
                    <th className="text-left p-2 border">Value</th>
                    <th className="text-center p-2 border w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, itemIdx) => (
                    <tr key={itemIdx} className="border-b">
                      <td className="p-1 border">
                        <input
                          type="text"
                          placeholder="e.g. Weight, Material"
                          value={item.title}
                          onChange={(e) => updateSpecItem(groupIdx, itemIdx, 'title', e.target.value)}
                          className="border p-1.5 rounded w-full"
                        />
                      </td>
                      <td className="p-1 border">
                        <input
                          type="text"
                          placeholder="e.g. 200g, Cotton"
                          value={item.value}
                          onChange={(e) => updateSpecItem(groupIdx, itemIdx, 'value', e.target.value)}
                          className="border p-1.5 rounded w-full"
                        />
                      </td>
                      <td className="p-1 border text-center">
                        {group.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSpecItem(groupIdx, itemIdx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => addSpecItem(groupIdx)}
              className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              + Add Row
            </button>
          </div>
        ))}
      </div>
      {/* ===== END SPECS SECTION ===== */}

      {/* ===== IMAGE UPLOAD FOR SINGLE PRODUCT ===== */}
      {productType === 'single' && (
        <div className="mb-4">
          <Upload onFilesUpload={(urls) => setImg(urls)} />
          <span className="text-sm text-gray-500">Max 12 images</span>
        </div>
      )}

      <label className="block text-lg font-bold mb-2">Description</label>
      <ReactQuill
        value={description}
        onChange={setDescription}
        className="mb-4"
        theme="snow"
        placeholder="Write your product description here..."
      />

      <br />

      <button type="submit" className="bg-green-500 text-white px-4 py-2">
        Save Product
      </button>
    </form>
  );
}
