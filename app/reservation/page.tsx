
"use client"
import Link from "next/link";
import ExportButton from "../components/ExportExcel";
import { generateInvoice } from "../utils/generateInvoice";
import { useState, useEffect } from "react";
import { redirect, useRouter } from 'next/navigation';





const page = () => {
  const [allTemp, setTemp] = useState<any>()
  const [updatedNums, setUpdatedNums] = useState({});
  const [submittedPosts, setSubmittedPosts] = useState({});
  const [filterClientName, setFilterClientName] = useState("");
  const [filterReceiptNum, setFilterReceiptNum] = useState("");
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [totals, setTotals] = useState({});

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
    const selectedColorObj =
      colors.find((c) => c?.color === item.selectedColor) || colors[0];

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


  const filteredData = allTemp?.filter((post) => {
    const clientMatch = filterClientName
      ? post.cartItems?.fname?.toLowerCase().includes(filterClientName.toLowerCase())
      : true;

    const receiptMatch = filterReceiptNum
      ? post.num?.toLowerCase().includes(filterReceiptNum.toLowerCase())
      : true;

    const postDate = new Date(post.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const dateInRange =
      (!from || postDate >= from) &&
      (!to || postDate <= to);

    return clientMatch && receiptMatch && dateInRange;
  });



  console.log("filteredData", filteredData);



  // Load submitted state from localStorage on mount
  useEffect(() => {
    const storedSubmittedPosts = JSON.parse(localStorage.getItem("submittedPosts")) || {};
    setSubmittedPosts(storedSubmittedPosts);
  }, []);

  const handleInputChange = (id, value) => {
    setUpdatedNums((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdate = async (id) => {
    const numToUpdate = updatedNums[id]; // Get the updated number

    if (!numToUpdate) return; // Prevent empty submission

    try {
      const response = await fetch(`/api/order1/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num: numToUpdate }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Receipt number updated:", result);

        // Update state and save to localStorage
        setSubmittedPosts((prev) => {
          const updatedState = { ...prev, [id]: true };
          localStorage.setItem("submittedPosts", JSON.stringify(updatedState));
          return updatedState;
        });
        window.location.reload();
      } else {
        console.error("Failed to update receipt number:", result);
      }
    } catch (error) {
      console.error("Error updating receipt number:", error);
    }
  };





  // Fetch products and categories on load
  useEffect(() => {
    fetchProducts();
  }, []);

const fetchProducts = async () => {
  try {
    const response = await fetch('/api/order');
    if (response.ok) {
      const data = await response.json();

      // Filter out deleted items
      const filteredData = data.filter(item => item.delete !== true);

      setTemp(filteredData);
    } else {
      console.error('Failed to fetch products');
    }
  } catch (error) {
    console.error('Error fetching products', error);
  }
};





  const handlePaymentUpdate = async (id) => {
    try {
      const response = await fetch(`/api/order/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: true }),
      });

      if (response.ok) {
        setTemp((prevOrders) =>
          prevOrders.map((order) =>
            order.id === id ? { ...order, paid: true } : order
          )
        );
        window.location.reload();
      } else {
        console.error("Failed to update payment status.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handlePaymentUpdate1 = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus; // Toggle fulfillment status

      const response = await fetch(`/api/order/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillment: newStatus }),
      });

      if (response.ok) {
        setTemp((prevOrders) =>
          prevOrders.map((order) =>
            order.id === id ? { ...order, fulfillment: newStatus } : order
          )
        );
        window.location.reload();
      } else {
        console.error("Failed to update fulfillment status.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };







  const handleDeleteOrder = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return; // If user clicks Cancel, stop the function

    let data

    try {
      const response = await fetch(`/api/order/${id}`, {
        method: "GET",
      });

      if (response.ok) {
        data = await response.json(); // Parse the response JSON
        console.log("Order data:", data);   // Log the data
      } else {
        console.error("Failed to get order");
      }
    } catch (error) {
      console.error("Error get order:", error);
    }







    if (Array.isArray(data.userInfo)) {
      for (const item of data.userInfo) {

        // Skip products that are not stock-tracked (nothing was ever deducted).
        if (item.stockEnabled === false) continue;

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

    }

try {
  const response = await fetch(`/api/order/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delete: true }),
  });

  if (response.ok) {
    console.log("Order marked as deleted");
    // Refresh orders after update
    window.location.replace("/reservation");
  } else {
    console.error("Failed to mark order as deleted");
  }
} catch (error) {
  console.error("Error updating order:", error);
}

  };









  const calculateOrderTotal = async (order) => {
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
      } catch (err) {
        console.error("Discount API failed", err);
      }
    }

    const discountAmount = (itemsTotal * discountPercent) / 100;
    const delivery = toNumber(order.delivery);
    const finalTotal = itemsTotal - discountAmount + delivery;

    return finalTotal.toFixed(2);
  };



  useEffect(() => {
    const fetchTotals = async () => {
      if (!Array.isArray(allTemp)) return;
      const result = {};
      for (const order of allTemp) {
        const total = await calculateOrderTotal(order);
        result[order.oid] = total;
      }
      setTotals(result);
    };

    fetchTotals();
  }, [allTemp]);


  return (
    <div className="container text-[12px]">
      <div className="flex justify-end items-center space-x-2 mb-4">
        <input
          type="text"
          value={filterClientName}
          onChange={(e) => setFilterClientName(e.target.value)}
          placeholder="Filter by Client Name"
          className="border p-1 text-xs"
        />
        <input
          type="text"
          value={filterReceiptNum}
          onChange={(e) => setFilterReceiptNum(e.target.value)}
          placeholder="Filter by Receipt #"
          className="border p-1 text-xs"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-1 text-xs"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-1 text-xs"
        />

        <div className="text-xs">
          <ExportButton allTemp={allTemp} />
        </div>
      </div>
      <table className="table table-striped ">
        <thead>
          <tr>
            <th scope="col">Order #</th>
            <th scope="col">Receipt #</th>
            <th scope="col">Image</th>
            <th scope="col">Client Name</th>
            <th scope="col">Total Amount</th>
            <th scope="col">Total Items</th>
            <th scope="col">Code</th>
            <th scope="col">Date</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredData?.length > 0 ? (
            filteredData.map((post) => (
              <tr key={post.id}>
                <td>{post.oid}</td>
                <td>
                  {submittedPosts[post.id] ? (
                    <p>{updatedNums[post.id] || post.num}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={updatedNums[post.id] || post.num || ""}
                        onChange={(e) => handleInputChange(post.id, e.target.value)}
                        placeholder="Enter receipt number"
                        className="border p-1"
                      />
                      <button
                        onClick={() => handleUpdate(post.id)}
                        className="bg-blue-500 text-white p-1 ml-2"
                      >
                        Submit
                      </button>
                    </>
                  )}
                </td>

                <td>
                  <img src={post.userInfo[0].img[0]} width={40} height={40} />
                </td>
                <td>{post.cartItems.fname}</td>
                <td>{totals[post.oid] ? `$${totals[post.oid]}` : "..."}</td>
                <td>
                  {post.userInfo?.reduce(
                    (acc, item) =>
                      acc + (isNaN(item.quantity) ? 0 : Number(item.quantity)),
                    0
                  )}
                </td>
                <td>{post.code}</td>
                <td>{post.date}</td>
                <td className="flex space-x-2">
                  <a
                    className="text-blue-700 bg-black p-1 w-14 h-8 flex items-center justify-center "
                    href={`/order?id=${post.id}`}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteOrder(post.id)}
                    className="bg-red-500 text-white p-1 w-14 h-8 "
                  >
                    Delete
                  </button>
                  <button
                    className={`p-1 w-14 h-8 ${post.paid ? "bg-blue-500 text-white" : "bg-black text-white"
                      }`}
                    onClick={() => !post.paid && handlePaymentUpdate(post.id)}
                    disabled={
                      !((updatedNums[post.id] || post.num) && submittedPosts[post.id]) || post.paid
                    } // Disable if no receipt or not submitted
                  >
                    {post.paid ? "Paid" : "Unpaid"}
                  </button>

                  <button
                    className={`p-1 w-20 h-8 ${post.fulfillment ? "bg-blue-500 text-white" : "bg-black text-white"
                      }`}
                    onClick={() => handlePaymentUpdate1(post.id, post.fulfillment)}
                    disabled={
                      !((updatedNums[post.id] || post.num) && submittedPosts[post.id])
                    } // Disable if no receipt or not submitted
                  >
                    {post.fulfillment ? "Fulfilled" : "Unfulfilled"}
                  </button>

                  <button
                    className="bg-emerald-600 text-white p-1 w-16 h-8"
                    onClick={() => generateInvoice(post)}
                  >
                    Invoice
                  </button>



                </td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-center">
                No matching records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

  )
}

export default page