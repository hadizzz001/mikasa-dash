"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from "react";




const page = () => {
  const [allTemp1, setTemp1] = useState()
  const searchParams = useSearchParams()
  const search = searchParams.get('id') 
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
    const [totalAmount, setTotalAmount] = useState(null)
  const [editableData, setEditableData] = useState({
    fname: allTemp1?.cartItems?.fname || '',
    lname: allTemp1?.cartItems?.lname || '',
    phone: allTemp1?.cartItems?.phone || '',
    city: allTemp1?.cartItems?.city || '',
    address: allTemp1?.cartItems?.address || '',
    apt: allTemp1?.cartItems?.apt || '', 
  });
  const [remark, setRemark] = useState({ 
    apt: allTemp1?.remark || ''
  });

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getDiscountedValue = (priceLike, percentageLike, discountLike) => {
    const discountValue = toNumber(discountLike);
    if (discountValue > 0) return discountValue;

    const priceValue = toNumber(priceLike);
    const percentageValue = toNumber(percentageLike);

    if (priceValue > 0 && percentageValue > 0) {
      return priceValue - (priceValue * percentageValue) / 100;
    }

    return priceValue;
  };

  const resolveLineItemUnitPrice = (item) => {
    if (!item) return 0;

    const colors = Array.isArray(item.color) ? item.color : [];
    const selectedColorObj = colors.find((c) => c?.color === item.selectedColor) || colors[0];

    if (selectedColorObj && Array.isArray(selectedColorObj.sizes) && selectedColorObj.sizes.length > 0) {
      const selectedSizeObj =
        selectedColorObj.sizes.find((s) => s?.size === item.selectedSize) || selectedColorObj.sizes[0];

      if (selectedSizeObj) {
        return getDiscountedValue(
          selectedSizeObj.price,
          selectedSizeObj.percentage,
          selectedSizeObj.discount
        );
      }
    }

    if (selectedColorObj) {
      return getDiscountedValue(
        selectedColorObj.price,
        selectedColorObj.percentage,
        selectedColorObj.discount
      );
    }

    return getDiscountedValue(item.price, item.percentage, item.discount);
  };

  // Determine how a product's variants are structured
  const getCollectionMode = (product) => {
    if (!product || product.type !== 'collection') return 'single';
    if (product.collectionMode) return product.collectionMode;
    // Fallback inference for legacy products saved before collectionMode existed
    const variants = Array.isArray(product.color) ? product.color : [];
    const anyColor = variants.some((v) => v?.color);
    const anySize = variants.some((v) => Array.isArray(v?.sizes) && v.sizes.some((s) => s?.size));
    if (anyColor && anySize) return 'sizeColor';
    if (anyColor) return 'colorOnly';
    if (anySize) return 'sizeOnly';
    return 'sizeColor';
  };




  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/order/${search}`);
        if (response.ok) {
          const data = await response.json();
          setTemp1(data); 

          setEditableData({
            fname: data?.cartItems?.fname || '',
            lname: data?.cartItems?.lname || '',
            phone: data?.cartItems?.phone || '',
            city: data?.cartItems?.city || '',
            address: data?.cartItems?.address || '',
            apt: data?.cartItems?.apt || ''
          });
          setRemark(data?.remark || '');
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);


  // Handle change for inputs
  const handleFieldChange = (field, value) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  // Handle save of edited fields
  const handleSaveCustomerDetails = async () => {
    console.log("Saving customer details:", editableData);


    try {
      const response = await fetch(`/api/order/${search}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cartItems: editableData,
          remark
         }),
      });

      if (response.ok) {
        console.log("Done!");
        window.location.reload();
      } else {
        console.error("Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }





  };







  const handleAddProduct = async () => {
    if (!selectedProduct || qty < 1) return;

    const id = selectedProduct.id || selectedProduct._id;
    const mode = getCollectionMode(selectedProduct);
    const variants = Array.isArray(selectedProduct.color) ? selectedProduct.color : [];
    const hasStockTracking = selectedProduct.stockEnabled ?? (selectedProduct.type === "collection" ? variants.length > 0 : selectedProduct.stock != null);

    // --- Validate the required selections for this collection mode ---
    if (mode === 'sizeColor') {
      if (!selectedColor) { alert("Please select a color."); return; }
      if (!selectedSize) { alert("Please select a size."); return; }
    } else if (mode === 'colorOnly') {
      if (!selectedColor) { alert("Please select a color."); return; }
    } else if (mode === 'sizeOnly') {
      if (!selectedSize) { alert("Please select a size."); return; }
    }

    // size-only: the lone variant has an empty color name.
    // color-only: the variant's single size row has an empty size name.
    const colorToSend = mode === 'sizeOnly' ? (variants[0]?.color ?? '') : selectedColor;
    const sizeToSend = mode === 'colorOnly' ? '' : selectedSize;

    if (hasStockTracking) {
      let stockUrl = '';
      let body = '';

      if (selectedProduct.type === "single") {
        stockUrl = `/api/stock`;
        body = `${id},${qty}`;
      } else {
        // Every collection mode stores qty inside color[].sizes[] => deduct via stock2
        stockUrl = `/api/stock2`;
        body = `${id},${colorToSend},${sizeToSend},${qty}`;
      }

      try {
        const stockResponse = await fetch(stockUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "text/plain"
          },
          body
        });

        if (!stockResponse.ok) {
          const errorText = await stockResponse.text();
          alert(`Stock update failed: ${errorText || stockResponse.statusText}`);
          return;
        }
      } catch (error) {
        alert(`Error connecting to stock API: ${error.message}`);
        return;
      }
    }

    // Update the order if stock update succeeded
    const newItem = {
      ...selectedProduct, // spread the product properties
      quantity: qty,
      selectedColor: colorToSend,
      selectedSize: sizeToSend,
    };


    try {
      await fetch(`/api/order3/${search}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newItem }),
      });
    } catch (error) {
      alert(`Order update failed: ${error.message}`);
    }

    setShowModal(false);
    window.location.replace(`/order?id=${search}`);
  };







  const calculateFinalTotal = () => {
    if (allTemp1 && allTemp1.userInfo) {
      const result = allTemp1.userInfo.reduce(
        (acc, post) => {
          const price = post.price;
          const qty = post.quantity;
          acc.totalPrice += isNaN(price) || isNaN(qty) ? 0 : price * qty;
          acc.totalItems += isNaN(qty) ? 0 : qty;
          return acc;
        },
        { totalPrice: 0, totalItems: 0 }
      );

      return result;
    }

    return { totalPrice: 0, totalItems: 0 };
  };
  const finalTotal = calculateFinalTotal();
 


  const fetchAvailableProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();

    const inStock = data.filter(product => {
      if (product.stockEnabled === false) {
        return true;
      }

      if (product.type === 'collection' && Array.isArray(product.color)) {
        return product.color.some((variant) => {
          if (Array.isArray(variant?.sizes)) {
            return variant.sizes.some((sz) => Number(sz?.qty) > 0);
          }
          return Number(variant?.qty) > 0;
        });
      }

      return Number(product.stock) > 0;
    });

    setAllProducts(inStock);
  };


  const handleProductChange = (product) => {
    setSelectedProduct(product);
    setSelectedColor('');
    setSelectedSize('');

    const mode = getCollectionMode(product);
    const variants = Array.isArray(product.color) ? product.color : [];
    const trackStock = product.stockEnabled !== false;

    if (mode === 'sizeOnly') {
      // single variant (empty color) carries the sizes
      const sizes = variants[0]?.sizes || [];
      const usable = trackStock ? sizes.filter((s) => Number(s?.qty) > 0) : sizes;
      setAvailableColors([]);
      setAvailableSizes(usable.map((s) => s.size).filter(Boolean));
    } else if (mode === 'colorOnly') {
      const usable = trackStock
        ? variants.filter((v) => Number(v?.sizes?.[0]?.qty) > 0)
        : variants;
      setAvailableColors(usable.map((c) => c.color).filter(Boolean));
      setAvailableSizes([]);
    } else if (mode === 'sizeColor') {
      const usable = trackStock
        ? variants.filter((v) => Array.isArray(v?.sizes) && v.sizes.some((s) => Number(s?.qty) > 0))
        : variants;
      setAvailableColors(usable.map((c) => c.color).filter(Boolean));
      setAvailableSizes([]);
    } else {
      // single product
      setAvailableColors([]);
      setAvailableSizes([]);
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setSelectedSize('');
    const colorObj = (selectedProduct?.color || []).find((c) => c.color === color);
    const trackStock = selectedProduct?.stockEnabled !== false;

    if (colorObj?.sizes) {
      const usable = trackStock
        ? colorObj.sizes.filter((s) => Number(s?.qty) > 0)
        : colorObj.sizes;
      setAvailableSizes(usable.map((s) => s.size).filter(Boolean));
    } else {
      setAvailableSizes([]);
    }
  };




  const handleDeleteOrder = async (item, idx) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return;


    // Restore stock for the removed item, mirroring how it was deducted on add.
    // Skip products that are not stock-tracked (nothing was ever deducted).
    if (item.stockEnabled !== false) {
      if (item.type === "single") {
        // Single product: quantity is stored in product.stock
        await fetch(`api/stock3`, {
          method: "PATCH",
          headers: {
            'Content-Type': 'text/plain',
          },
          body: `${item._id || item.id},${item.quantity}`,
        });
      } else {
        // Collection (size+color, color only, or size only):
        // quantity always lives in color[].sizes[].qty -> restore via stock5
        await fetch(`api/stock5`, {
          method: "PATCH",
          headers: {
            'Content-Type': 'text/plain',
          },
          body: `${item._id || item.id},${item.quantity},${item.selectedColor ?? ''},${item.selectedSize ?? ''}`,
        });
      }
    }




    try {
      const response = await fetch(`/api/order4`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'text/plain',
        },
        body: `${search},${idx}`,
      });

      if (response.ok) {
        console.log("Order deleted and stock restored");
        // Refresh orders after deletion
        window.location.replace("/order?id=" + search);
      } else {
        console.error("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };



  const handleRemarkChange = (event) => { 
  setRemark(event.target.value);
};







const calculateOrderTotal = async (orders) => {
  let grandTotal = 0;

  for (const order of orders) {
    let itemsTotal = 0;

    for (const item of order.userInfo) {
      const unitPrice = resolveLineItemUnitPrice(item);
      const qty = parseInt(item.quantity || 1, 10);
      itemsTotal += unitPrice * qty;
    }

    let discountPercent = 0;
    if (order.code) {
      try {
        const res = await fetch(`/api/offer/${order.code}`);
        const data = await res.json();
        discountPercent = data?.per || 0;
      } catch (error) {
        console.error("Failed to fetch discount:", error);
      }
    }

    const discountAmount = (itemsTotal * discountPercent) / 100;
    const delivery = toNumber(order.delivery);
    const finalTotal = itemsTotal - discountAmount + delivery;

    grandTotal += finalTotal;
  }

  return grandTotal.toFixed(2);
};



  useEffect(() => {
    const fetchTotal = async () => {
      if (allTemp1) {
        const total = await calculateOrderTotal([allTemp1]);
        setTotalAmount(total);
      }
    };

    fetchTotal();
  }, [allTemp1]);




  return (
    <>
      <div className="bg-gray-100 h-screen py-8 text-[14px]">
        <div className="container mx-auto px-4">
          <p className="font-bold mb-4">Order #: {allTemp1?.oid}</p> 
          <p className="font-bold mb-4">Receipt #: {allTemp1?.num}</p>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="col-md-8">
              <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-semibold">Product</th>
                      <th className="text-left font-semibold">Pic</th>
                      <th className="text-left font-semibold">Price</th>
                      <th className="text-left font-semibold">Color</th>
                      <th className="text-left font-semibold">Size</th>
                      <th className="text-left font-semibold">Quantity</th>
                      <th className="text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTemp1 && Object?.keys(allTemp1).length > 0 ? (
                      allTemp1.userInfo.map((temp, index) => (

                        <>
                          <tr>
                            <td className="py-4">
                              <div className="flex items-center">
                                <span className="font-semibold">{temp.title}</span>
                              </div>
                            </td>
                            <td className="py-4">  <img src={temp.img[0]} width={40} height={40} /></td>
                            <td className="py-4">
                              ${resolveLineItemUnitPrice(temp).toFixed(2)}


                            </td>
                            <td className="py-4">{temp.selectedColor}</td>
                            <td className="py-4">{temp.selectedSize}</td>

                            <td className="py-4">
                              <div className="flex items-center">
                                <span className="text-center w-8">{temp.quantity}</span>
                              </div>
                            </td>

                            <td className="py-4">
                              {allTemp1.userInfo.length > 1 && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-red-500 cursor-pointer"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  onClick={() => handleDeleteOrder(temp, index)}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </td>


                          </tr>
                        </>
                      ))

                    ) : (
                      <div className='home___error-container'>
                        <h2 className='text-black text-xl dont-bold'>...</h2>

                      </div>
                    )}
                  </tbody>
                </table>
{!allTemp1?.delete && (
  <button
    onClick={() => {
      fetchAvailableProducts();
      setShowModal(true);
    }}
    className="bg-green-600 text-white px-4 py-2 rounded mb-4"
  >
    Add New Product
  </button>
)}



              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Customer Details</h2>

                {allTemp1 && Object?.keys(allTemp1).length > 0 ? (
                  <>
<div className="flex justify-between mb-2">
  <span>First Name:</span>
  <input
    type="text"
    className="border p-1 w-1/2"
    value={editableData.fname}
    onChange={(e) => handleFieldChange("fname", e.target.value)}
    disabled={allTemp1?.delete === true}
  />
</div>
<div className="flex justify-between mb-2">
  <span>Last Name:</span>
  <input
    type="text"
    className="border p-1 w-1/2"
    value={editableData.lname}
    onChange={(e) => handleFieldChange("lname", e.target.value)}
    disabled={allTemp1?.delete === true}
  />
</div>


                    <div className="flex justify-between mb-2">
                      <span>Phone:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        disabled={allTemp1?.delete === true}
                      />
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>Country:</span>
                      <span>{allTemp1.cartItems.country}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>City:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        disabled={allTemp1?.delete === true}
                      />
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>Address:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.address}
                        onChange={(e) => handleFieldChange("address", e.target.value)}
                        disabled={allTemp1?.delete === true}
                      />
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>Apt-Street:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.apt}
                        onChange={(e) => handleFieldChange("apt", e.target.value)}
                        disabled={allTemp1?.delete === true}
                      />
                    </div>

                    <hr className="my-2" />

                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Total Items:</span>
                      <span className="font-semibold">{finalTotal.totalItems}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Code:</span>
                      <span className="font-semibold">{allTemp1.code}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Delivery:</span>
                      <span className="font-semibold">${allTemp1.delivery}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-semibold">{totalAmount !== null ? `$${totalAmount}` : "..."}</span>
                    </div>

                    <div className="mt-4">
<textarea
  value={remark}
  onChange={handleRemarkChange}
  placeholder="Enter remark"
  className="border p-1 w-full"
  disabled={allTemp1?.delete === true}
/>

                      <div className="mt-2"> 
                        <button
                          onClick={handleSaveCustomerDetails}
                          className="bg-green-500 text-white p-1"
                          disabled={allTemp1?.delete === true}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='home___error-container'>
                    <h2 className='text-black text-xl font-bold'>...</h2>
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[90%] max-w-md relative">
            <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-lg">×</button>

            <h2 className="text-lg font-bold mb-4">Add New Product</h2>

            <label>Select Product:</label>
            <select
              onChange={(e) => handleProductChange(JSON.parse(e.target.value))}
              className="w-full border p-2 mb-4"
            >
              <option value="">Choose product</option>
              {allProducts.map(p => (
                <option key={p._id} value={JSON.stringify(p)}>{p.title}</option>
              ))}
            </select>

            {availableColors.length > 0 && (
              <>
                <label>Color:</label>
                <select
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full border p-2 mb-4"
                >
                  <option value="">Choose color</option>
                  {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}

            {availableSizes.length > 0 && (
              <>
                <label>Size:</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full border p-2 mb-4"
                >
                  <option value="">Choose size</option>
                  {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}

            <label>Quantity:</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full border p-2 mb-4"
              min={1}
            />

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              onClick={handleAddProduct}
            >
              Confirm Add
            </button>
          </div>
        </div>
      )}



    </>
  )
}

export default page