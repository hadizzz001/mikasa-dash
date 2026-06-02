'use client';

import { useState, useEffect } from 'react';
import Upload from '../components/Upload';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import ExportToExcel from '../components/ExportToExcel';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function ProductTable() {
  const [products, setProducts] = useState([]);
  const [products1, setProducts1] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');


  // Fetch products and categories on load
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);



  const fetchProducts = async () => {
    const response = await fetch('/api/products');
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    } else {
      console.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    const response = await fetch('/api/category');
    if (response.ok) {
      const data = await response.json();
      setCategories(data);
    } else {
      console.error('Failed to fetch categories');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Product deleted successfully');
          fetchProducts();
        } else {
          console.error('Failed to delete product');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleUpdate = async (updatedProduct) => {
    try {
      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        alert('Product updated successfully');
        setEditingProduct(null);
        fetchProducts();
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filter products by search query
  const filterBySearch = (product) => {
    return product.title.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Filter products by selected category
  const filterByCategory = (product) => {
    const isFilteredByCategory = selectedCategory ? product.category === selectedCategory : true;

    return isFilteredByCategory;
  };

  // Apply both search and category filters
  const filteredProducts = products.filter((product) => {
    return filterBySearch(product) && filterByCategory(product);
  });



const handleSaveAll = async () => {
  try {
    // Filter only products that have a valid id
    const updates = products
      .filter((p) => p.id && p.sort !== undefined && p.sort !== null)
      .map(({ id, sort }) => ({ id, sort }));

    if (updates.length === 0) {
      alert("No products to update!");
      return;
    }

    // Run all PATCH requests in parallel
    await Promise.all(
      updates.map((item) =>
        fetch(`/api/products1/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort: Number(item.sort) }),
        })
      )
    );

    alert("✅ All sort values saved successfully!");
    fetchProducts(); // Refresh data after update
  } catch (error) {
    console.error("Error saving all:", error);
    alert("❌ Failed to save sort values");
  }
};





  return (
    <div className="max-w-7xl mx-auto p-4 text-[12px]">
      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onCancel={() => setEditingProduct(null)}
          onSave={handleUpdate}
        />
      )}
      <h1 className="text-2xl font-bold mb-4">Product List</h1>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border p-2"
          placeholder="Search by title..."
        />
      </div>

      {/* Category Filter */}
      {/* <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full border p-2"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div> */}

      <ExportToExcel products={products} />

          <button
      onClick={handleSaveAll}
      className="ml-3 px-4 py-2 bg-blue-600 text-white rounded mb-5"
    >
      Save Sorts
    </button>



      <table className="table-auto w-full border-collapse border border-gray-200 mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Title</th>
            {/* <th className="border p-2">Pic</th> */}
            {/* <th className="border p-2">Category</th> */}
            <th className="border p-2">Type</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Colors / Sizes &amp; Pricing</th>
            <th className="border p-2">Sort</th> 
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((product) => {
            const isCollection = product.type === 'collection';
            const hasStockTracking = product.stockEnabled ?? (isCollection ? Array.isArray(product.color) : product.stock != null);

            const collectionStock = isCollection && Array.isArray(product.color)
              ? product.color.reduce((sum, variant) => {
                  const variantSizes = Array.isArray(variant?.sizes) ? variant.sizes : [];
                  return sum + variantSizes.reduce((s, sz) => s + (Number(sz?.qty) || 0), 0);
                }, 0)
              : 0;

            const singleStock = Number(product.stock) || 0;
            const effectiveStock = isCollection ? collectionStock : singleStock;

            const isOutOfStockSingle = hasStockTracking && effectiveStock <= 0;
            const isLowStock = hasStockTracking && effectiveStock > 0 && effectiveStock < 3;

            let rowClass = "";
            if (isOutOfStockSingle) {
              rowClass = "bg-red-300";
            } else if (isLowStock) {
              rowClass = "bg-yellow-300";
            }





            return (
              <tr key={product.id} className={rowClass}>

                <td className="border p-2">{product.title}</td>
                {/* <td className="border p-2">
                  {isVideo ? (
                    <video controls className="w-24 h-auto">
                      <source src={fileUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={fileUrl} alt="Product" className="w-24 h-auto" />
                  )}
                </td> */}

                <td className="border p-2">{product.type}</td>

                <td className="border p-2">
                  {!hasStockTracking ? (
                    <span className="text-gray-400">Not tracked</span>
                  ) : product.type === 'collection' ? (
                    <span className="text-gray-500">Per variant only</span>
                  ) : (
                    product.stock
                  )}
                </td>

                <td className="border p-2">
                  {product.type === 'collection' && Array.isArray(product.color) && product.color.length > 0 ? (
                    <div className="space-y-2">
                      {product.color.map((variant, vi) => (
                        <div key={vi}>
                          <div className="flex items-center gap-1 mb-1">
                            {variant.colorCode && (
                              <span style={{ backgroundColor: variant.colorCode }} className="inline-block w-3 h-3 rounded-full border border-gray-400" />
                            )}
                            <strong>{variant.color}</strong>
                          </div>
                          <div className="pl-4 text-[11px] text-gray-700">
                            {variant.sizes?.map((sz, si) => {
                              const pct = Number(sz.percentage) || 0;
                              const legacyPct = !pct && sz.discount && Number(sz.discount) > 0 && Number(sz.discount) <= 100 ? Number(sz.discount) : 0;
                              const usePct = pct || legacyPct;
                              const finalPrice = sz.price && usePct > 0 ? (Number(sz.price) - Number(sz.price) * usePct / 100).toFixed(2) : null;
                              return (
                                <div key={si} className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">{sz.size}</span>
                                  {hasStockTracking && <span>×{sz.qty}</span>}
                                  {sz.price && (
                                    finalPrice ? (
                                      <>
                                        <span className="line-through text-gray-400">${Number(sz.price).toFixed(2)}</span>
                                        <span className="text-orange-600">{usePct}% off</span>
                                        <span className="text-green-700 font-semibold">${finalPrice}</span>
                                      </>
                                    ) : (
                                      <span className="text-gray-600">${Number(sz.price).toFixed(2)}</span>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-700 flex flex-wrap items-center gap-2">
                      {product.price && product.percentage && Number(product.percentage) > 0 ? (
                        <>
                          <span className="line-through text-gray-400">${Number(product.price).toFixed(2)}</span>
                          <span className="text-orange-600">{product.percentage}% off</span>
                          <span className="text-green-700 font-semibold">${product.discount ? Number(product.discount).toFixed(2) : (Number(product.price) - Number(product.price) * Number(product.percentage) / 100).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-gray-600">${product.price ? Number(product.price).toFixed(2) : '0.00'}</span>
                      )}
                    </div>
                  )}
                </td>

<td className="border p-2">
  <input
    type="number"
    value={product.sort || ''}
    onChange={(e) => {
      const updated = [...products];
      const index = updated.findIndex((p) => p.id === product.id);
      updated[index].sort = e.target.value;
      setProducts(updated); // ✅ Keep sort change in main state
    }}
    className="border p-1 w-20"
  />
</td>




                <td className="border p-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-yellow-500 text-white px-2 py-1 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-500 text-white px-2 py-1"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>


    </div>
  );
}




 
function EditProductForm({ product, onCancel, onSave }) {
  const [title, setTitle] = useState(product.title || '');
  const [code, setCode] = useState(product.code || '');
  const [description, setDescription] = useState(product.description || '');
  const [img, setImg] = useState(product.img || []);
  const [sale, setSale] = useState(product.sale === "yes");
  const [noPrice, setNoPrice] = useState(product.noprice === "yes");
  const [includeTax, setIncludeTax] = useState(product.tax === "yes");
  const [stockEnabled, setStockEnabled] = useState(product.stockEnabled ?? product.stock != null);
  const [productType, setProductType] = useState(product.type === 'collection' ? 'collection' : 'single');

  // Single product fields
  const [singlePrice, setSinglePrice] = useState(product.type !== 'collection' ? (product.price || '') : '');
  const [singleDiscount, setSingleDiscount] = useState(product.type !== 'collection' ? (product.percentage || '') : '');
  const [singleStock, setSingleStock] = useState(product.type !== 'collection' ? (product.stock || '') : '');

  // Dropdowns
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSub, setSelectedSub] = useState(product.sub || '');
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(product.factory || '');

  // DB colors & sizes
  const [dbColors, setDbColors] = useState([]);
  const [dbSizes, setDbSizes] = useState([]);

  // Collection variants
  const [variants, setVariants] = useState(
    product.type === 'collection' && Array.isArray(product.color) && product.color.length > 0
      ? product.color.map((v) => ({
          ...v,
          sizes: (v.sizes || []).map((sz) => {
            // Back-compat: older records stored % in `discount`. Detect: discount <= 100 and no percentage field => treat as %.
            const hasPercentage = sz.percentage !== undefined && sz.percentage !== null && sz.percentage !== '';
            const legacyPct = !hasPercentage && sz.discount && Number(sz.discount) > 0 && Number(sz.discount) <= 100;
            const percentage = hasPercentage ? String(sz.percentage) : (legacyPct ? String(sz.discount) : '');
            const price = Number(sz.price) || 0;
            const pct = Number(percentage) || 0;
            const finalPrice = price > 0 && pct > 0 ? (price - (price * pct / 100)).toFixed(2) : '';
            return {
              size: sz.size || '',
              qty: sz.qty || '',
              price: sz.price || '',
              percentage,
              discount: finalPrice,
            };
          }),
        }))
      : [{ color: '', colorCode: '', sizes: [{ size: '', qty: '', price: '', percentage: '', discount: '' }] }]
  );

  // Specs
  const [specs, setSpecs] = useState(
    Array.isArray(product.specs) && product.specs.length > 0 ? product.specs : []
  );

  // --- Spec Helpers ---
  const addSpecGroup = () => setSpecs([...specs, { title: '', items: [{ title: '', value: '' }] }]);
  const removeSpecGroup = (i) => setSpecs(specs.filter((_, idx) => idx !== i));
  const updateSpecGroupTitle = (i, t) => { const u = [...specs]; u[i].title = t; setSpecs(u); };
  const addSpecItem = (i) => { const u = [...specs]; u[i].items.push({ title: '', value: '' }); setSpecs(u); };
  const removeSpecItem = (gi, si) => { const u = [...specs]; u[gi].items = u[gi].items.filter((_, i) => i !== si); setSpecs(u); };
  const updateSpecItem = (gi, si, field, val) => { const u = [...specs]; u[gi].items[si][field] = val; setSpecs(u); };

  // --- Variant Helpers ---
  const addColor = () => setVariants([...variants, { color: '', colorCode: '', sizes: [{ size: '', qty: '', price: '', percentage: '', discount: '' }] }]);
  const removeColor = (i) => setVariants(variants.filter((_, idx) => idx !== i));
  const selectColor = (i, name) => {
    if (variants.some((v, idx) => idx !== i && v.color === name)) { alert(`Color "${name}" is already added.`); return; }
    const u = [...variants]; const db = dbColors.find(c => c.name === name);
    u[i].color = name; u[i].colorCode = db?.code || ''; setVariants(u);
  };
  const addSize = (ci) => { const u = [...variants]; u[ci].sizes.push({ size: '', qty: '', price: '', percentage: '', discount: '' }); setVariants(u); };
  const removeSize = (ci, si) => { const u = [...variants]; u[ci].sizes = u[ci].sizes.filter((_, i) => i !== si); setVariants(u); };
  const updateSize = (ci, si, field, val) => {
    if (field === 'size' && variants[ci].sizes.some((sz, i) => i !== si && sz.size === val)) { alert(`Size "${val}" already added for this color.`); return; }
    const u = [...variants]; u[ci].sizes[si][field] = val;
    if (field === 'price' || field === 'percentage') {
      const sz = u[ci].sizes[si];
      const p = Number(sz.price);
      const pct = Number(sz.percentage);
      sz.discount = (p > 0 && pct > 0) ? (p - (p * pct / 100)).toFixed(2) : '';
    }
    setVariants(u);
  };

  // Auto-calculate prices
  const allPrices = variants.flatMap(v => v.sizes.map(sz => {
    if (sz.percentage && Number(sz.percentage) > 0) return Number(sz.price) - (Number(sz.price) * Number(sz.percentage) / 100);
    return Number(sz.price) || 0;
  }).filter(p => p > 0));
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices).toFixed(2) : '';
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices).toFixed(2) : '';

  const getDiscountedPrice = (sz) => {
    if (sz.percentage && Number(sz.percentage) > 0 && sz.price && Number(sz.price) > 0)
      return (Number(sz.price) - (Number(sz.price) * Number(sz.percentage) / 100)).toFixed(2);
    return null;
  };

  // Fetch dropdown data
  useEffect(() => {
    fetch('/api/sub').then(r => r.json()).then(setSubcategories).catch(console.error);
    fetch('/api/factory').then(r => r.json()).then(setFactories).catch(console.error);
    fetch('/api/color').then(r => r.json()).then(setDbColors).catch(console.error);
    fetch('/api/size').then(r => r.json()).then(setDbSizes).catch(console.error);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    let computedPrice, computedStock, computedDiscount = null, colorData = null, percentageVal = null;

    if (productType === 'collection') {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.color?.trim()) { alert(`Please select a color for variant #${i + 1}`); return; }
        for (let j = 0; j < v.sizes.length; j++) {
          const sz = v.sizes[j];
          if (!sz.size?.trim()) { alert(`Please select a size for color "${v.color}", row #${j + 1}`); return; }
          if (stockEnabled && (!sz.qty || Number(sz.qty) < 0)) { alert(`Invalid qty for "${v.color}" / "${sz.size}"`); return; }
          if (!noPrice && (!sz.price || Number(sz.price) <= 0)) { alert(`Invalid price for "${v.color}" / "${sz.size}"`); return; }
        }
      }
      computedPrice = minPrice || '0';
      computedStock = null;
      computedDiscount = minPrice !== maxPrice ? minPrice : null;
      colorData = variants;
      const pcts = variants.flatMap(v => v.sizes.map(sz => Number(sz.percentage) || 0)).filter(p => p > 0);
      if (pcts.length > 0) {
        const minP = Math.min(...pcts);
        const maxP = Math.max(...pcts);
        percentageVal = minP === maxP ? String(minP) : `${minP}-${maxP}`;
      }
    } else {
      computedPrice = singlePrice ? Number(singlePrice).toFixed(2) : '0';
      computedStock = stockEnabled ? singleStock || '0' : null;
      if (singleDiscount && Number(singleDiscount) > 0) {
        computedDiscount = (Number(singlePrice) - (Number(singlePrice) * Number(singleDiscount) / 100)).toFixed(2);
        percentageVal = singleDiscount;
      }
    }

    onSave({
      ...product,
      title,
      code,
      description,
      sale: sale ? "yes" : "no",
      noprice: noPrice ? "yes" : "no",
      tax: includeTax ? "yes" : "no",
      price: computedPrice,
      discount: computedDiscount,
      percentage: percentageVal,
      img,
      sub: selectedSub,
      factory: selectedFactory,
      type: productType,
      stock: computedStock,
      stockEnabled,
      color: colorData,
      specs: specs.length > 0 ? specs : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="text-[12px] border p-4 bg-gray-100 rounded max-w-3xl mx-auto mb-8">
      <h2 className="text-xl font-bold mb-4">Edit Product</h2>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2" required />
      </div>

      {/* Item Code */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Item Code</label>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full border p-2" required />
      </div>

      {/* Category & Sub-Category */}
      <label className="block text-sm font-bold mb-1">Category</label>
      <select className="w-full p-2 border mb-2" value={selectedFactory} onChange={(e) => setSelectedFactory(e.target.value)} required>
        <option value="" disabled>Select Category</option>
        {factories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
      </select>

      <label className="block text-sm font-bold mb-1">Sub-Category</label>
      <select className="w-full p-2 border mb-4" value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)} required>
        <option value="" disabled>Select Sub-Category</option>
        {subcategories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
      </select>

      {/* Checkboxes */}
      <div className="flex gap-6 my-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={sale} onChange={(e) => setSale(e.target.checked)} />
          <span>Sale</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={noPrice} onChange={(e) => setNoPrice(e.target.checked)} />
          <span>No Price</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeTax} onChange={(e) => setIncludeTax(e.target.checked)} />
          <span>Include Tax</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={stockEnabled} onChange={(e) => setStockEnabled(e.target.checked)} />
          <span>Track Stock</span>
        </label>
      </div>

      {/* Product Type */}
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">Product Type</label>
        <div className="flex gap-4">
          <label className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 ${productType === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <input type="radio" name="editProductType" value="single" checked={productType === 'single'} onChange={() => setProductType('single')} />
            <div><span className="font-semibold">Single</span><p className="text-xs text-gray-500">One price, optional stock</p></div>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 flex-1 ${productType === 'collection' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <input type="radio" name="editProductType" value="collection" checked={productType === 'collection'} onChange={() => setProductType('collection')} />
            <div><span className="font-semibold">Collection</span><p className="text-xs text-gray-500">Multiple colors &amp; sizes</p></div>
          </label>
        </div>
      </div>

      {/* ===== SINGLE PRICE/STOCK ===== */}
      {productType === 'single' && (
        <div className="border rounded-lg p-4 mb-4 bg-white">
          <h2 className="text-sm font-bold mb-3">Price{stockEnabled ? ' & Stock' : ''}</h2>
          {!noPrice && (
            <>
              <label className="block text-xs font-medium mb-1">Price</label>
              <input type="number" step="0.01" placeholder="Price" value={singlePrice} onChange={(e) => setSinglePrice(e.target.value)} className="w-full border p-2 mb-2" required />
              <label className="block text-xs font-medium mb-1">Discount Percentage (%)</label>
              <input type="number" step="0.01" min="0" max="100" placeholder="e.g. 10 for 10% off" value={singleDiscount} onChange={(e) => setSingleDiscount(e.target.value)} className="w-full border p-2 mb-2" />
              <label className="block text-xs font-medium mb-1">Discount (final price after % – read only)</label>
              <input
                type="text"
                readOnly
                value={
                  singlePrice && singleDiscount && Number(singleDiscount) > 0
                    ? (Number(singlePrice) - (Number(singlePrice) * Number(singleDiscount) / 100)).toFixed(2)
                    : ''
                }
                placeholder="Auto-calculated"
                className="w-full border p-2 mb-2 bg-gray-100 text-green-700 font-semibold"
              />
            </>
          )}
          {stockEnabled && <input type="number" placeholder="Stock" value={singleStock} min={0} onChange={(e) => setSingleStock(e.target.value)} className="w-full border p-2 mb-2" required />}
        </div>
      )}

      {/* ===== COLLECTION VARIANTS ===== */}
      {productType === 'collection' && (
        <div className="border rounded-lg p-4 mb-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">Colors &amp; Sizes</h2>
            <button type="button" onClick={addColor} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">+ Add Color</button>
          </div>

          {variants.map((variant, colorIdx) => (
            <div key={colorIdx} className="border rounded-lg p-3 mb-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                {variant.colorCode && (
                  <div style={{ backgroundColor: variant.colorCode }} className="w-8 h-8 rounded-full border border-gray-300 flex-shrink-0" />
                )}
                <select value={variant.color} onChange={(e) => selectColor(colorIdx, e.target.value)} className="border p-2 rounded flex-1 font-semibold" required>
                  <option value="" disabled>Select a Color</option>
                  {dbColors.filter(c => c.name === variant.color || !variants.some(v => v.color === c.name)).map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeColor(colorIdx)} className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600">✕</button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border">Size</th>
                      {stockEnabled && <th className="text-left p-2 border">Qty</th>}
                      {!noPrice && <th className="text-left p-2 border">Price</th>}
                      {!noPrice && <th className="text-left p-2 border">Disc %</th>}
                      {!noPrice && <th className="text-left p-2 border">Final</th>}
                      <th className="text-center p-2 border w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variant.sizes.map((sz, sizeIdx) => {
                      const dp = getDiscountedPrice(sz);
                      return (
                        <tr key={sizeIdx} className="border-b">
                          <td className="p-1 border">
                            <select value={sz.size} onChange={(e) => updateSize(colorIdx, sizeIdx, 'size', e.target.value)} className="border p-1.5 rounded w-full" required>
                              <option value="" disabled>Size</option>
                              {dbSizes.filter(s => s.name === sz.size || !variant.sizes.some(x => x.size === s.name)).map((s) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </td>
                          {stockEnabled && <td className="p-1 border"><input type="number" min="0" placeholder="Qty" value={sz.qty} onChange={(e) => updateSize(colorIdx, sizeIdx, 'qty', e.target.value)} className="border p-1.5 rounded w-full" required /></td>}
                          {!noPrice && <td className="p-1 border"><input type="number" step="0.01" min="0" placeholder="Price" value={sz.price} onChange={(e) => updateSize(colorIdx, sizeIdx, 'price', e.target.value)} className="border p-1.5 rounded w-full" required /></td>}
                          {!noPrice && <td className="p-1 border"><input type="number" step="0.01" min="0" max="100" placeholder="%" value={sz.percentage} onChange={(e) => updateSize(colorIdx, sizeIdx, 'percentage', e.target.value)} className="border p-1.5 rounded w-full" /></td>}
                          {!noPrice && (
                            <td className="p-1 border text-center">
                              <input
                                type="text"
                                readOnly
                                value={dp ? dp : sz.price ? Number(sz.price).toFixed(2) : ''}
                                placeholder="—"
                                className="border p-1.5 rounded w-full bg-gray-100 text-green-700 font-semibold text-center"
                                title="Final price = price × (1 - discount%/100)"
                              />
                            </td>
                          )}
                          <td className="p-1 border text-center">
                            {variant.sizes.length > 1 && <button type="button" onClick={() => removeSize(colorIdx, sizeIdx)} className="text-red-500 hover:text-red-700 font-bold">✕</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => addSize(colorIdx)} className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium">+ Add Size</button>
            </div>
          ))}

          {!noPrice && minPrice && (
            <div className="flex gap-6 mt-3 text-sm font-medium bg-white border rounded p-3">
              <span>Price Range: <strong className="text-green-600">{minPrice === maxPrice ? minPrice : `${minPrice} – ${maxPrice}`}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ===== SPECS ===== */}
      <div className="border rounded-lg p-4 mb-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Specifications</h2>
          <button type="button" onClick={addSpecGroup} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">+ Add Spec Group</button>
        </div>

        {specs.length === 0 && <p className="text-gray-400 text-sm">No specifications. Click "+ Add Spec Group" to add.</p>}

        {specs.map((group, gi) => (
          <div key={gi} className="border rounded-lg p-3 mb-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <input type="text" placeholder="Group title (e.g. General)" value={group.title} onChange={(e) => updateSpecGroupTitle(gi, e.target.value)} className="border p-2 rounded flex-1 font-semibold" />
              <button type="button" onClick={() => removeSpecGroup(gi)} className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600">✕</button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100"><th className="text-left p-2 border">Title</th><th className="text-left p-2 border">Value</th><th className="text-center p-2 border w-16"></th></tr></thead>
              <tbody>
                {group.items.map((item, ii) => (
                  <tr key={ii} className="border-b">
                    <td className="p-1 border"><input type="text" placeholder="e.g. Weight" value={item.title} onChange={(e) => updateSpecItem(gi, ii, 'title', e.target.value)} className="border p-1.5 rounded w-full" /></td>
                    <td className="p-1 border"><input type="text" placeholder="e.g. 200g" value={item.value} onChange={(e) => updateSpecItem(gi, ii, 'value', e.target.value)} className="border p-1.5 rounded w-full" /></td>
                    <td className="p-1 border text-center">{group.items.length > 1 && <button type="button" onClick={() => removeSpecItem(gi, ii)} className="text-red-500 hover:text-red-700 font-bold">✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={() => addSpecItem(gi)} className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium">+ Add Row</button>
          </div>
        ))}
      </div>

      {/* Description */}
      <label className="block text-sm font-bold mb-2">Description</label>
      <ReactQuill value={description} onChange={setDescription} className="mb-4" theme="snow" placeholder="Write your product description here..." />

      {/* Image Upload */}
      <Upload onFilesUpload={(url) => setImg(url)} />

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
        <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
      </div>
    </form>
  );
}


 