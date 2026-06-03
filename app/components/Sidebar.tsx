"use client";

import { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div id="sidenavv" style={{ position: "relative" }}>
      {/* Sidebar */}
      <nav
        style={{
          background: "#343a40",
          color: "white",
          height: "100vh",
          position: "fixed",
          width: isOpen ? "200px" : "0",
          left: isOpen ? "0" : "-200px",
          overflow: "hidden",
          transition: "left 0.3s ease-in-out",
          padding: isOpen ? "16px" : "0",
        }}
      >
        <div>
          <h3 style={{ textAlign: "center" }}>Dashboard</h3>
          <ul style={{ padding: 0, marginTop: "20px", listStyle: "none" }}>
            <li style={{ marginBottom: "15px" }}>
              <a href="/dashboard" style={{ color: "white", textDecoration: "none" }}>
                All Products
              </a>
            </li>
            <li>
              <a href="/products" style={{ color: "white", textDecoration: "none" }}>
                Add Product
              </a>
            </li>
            {/* <li>
              <a href="/category" style={{ color: "white", textDecoration: "none" }}>
                Add Category
              </a>
            </li>     */}
            <li>
              <a href="/factory" style={{ color: "white", textDecoration: "none" }}>
                Add Category
              </a>
            </li>
            <li>
              <a href="/color" style={{ color: "white", textDecoration: "none" }}>
                Add Colors
              </a>
            </li>
            <li>
              <a href="/size" style={{ color: "white", textDecoration: "none" }}>
                Add Sizes
              </a>
            </li>

            <li>
              <a href="/banner" style={{ color: "white", textDecoration: "none" }}>
                Edit Banner
              </a>
            </li>
            <li>
              <a href="/banner1" style={{ color: "white", textDecoration: "none" }}>
                Edit Quote Banner
              </a>
            </li>

            <li>
              <a href="/salesbanner" style={{ color: "white", textDecoration: "none" }}>
                Edit Sales Banner
              </a>
            </li>

            <li>
              <a href="/other-banners" style={{ color: "white", textDecoration: "none" }}>
                Other Banners
              </a>
            </li>

            <li>
              <a href="/sections" style={{ color: "white", textDecoration: "none" }}>
                4 Sections
              </a>
            </li>

            <li>
              <a href="/offer" style={{ color: "white", textDecoration: "none" }}>
                Add Code
              </a>
            </li>
            <li>
              <a href="/offer-text" style={{ color: "white", textDecoration: "none" }}>
                Offer Text
              </a>
            </li>
            <li>
              <a href="/reservation" style={{ color: "white", textDecoration: "none" }}>
                Orders
              </a>
            </li>
            {/* <li>
              <a href="/note" style={{ color: "white", textDecoration: "none" }}>
                Notification
              </a>
            </li>  */}
            <li>
              <a href="/" style={{ color: "white", textDecoration: "none" }}>
                Logout
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          top: "20px",
          left: isOpen ? "200px" : "10px",
          background: "#000",
          color: "white",
          border: "none",
          cursor: "pointer",
          padding: "8px 12px",
          fontSize: "18px",
          transition: "left 0.3s ease-in-out",
          borderRadius: "5px",
        }}
      >
        {isOpen ? <FaArrowLeft /> : <FaArrowRight />}
      </button>

      {/* Spacer to push content */}
      <div style={{ marginLeft: isOpen ? "200px" : "0", transition: "margin-left 0.3s ease-in-out" }} />
      <style
        dangerouslySetInnerHTML={{
          __html: "\n  a {\n    color: #fff !important;\n}\n"
        }}
      />

    </div>
  );
}
