'use client';

import { useState, useEffect } from 'react';

const DeliveryFeePage = () => {
  const [fee, setFee] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing delivery fee on mount
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const res = await fetch('/api/delivery-fee', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.fee !== undefined && data.fee !== null) {
            setFee(String(data.fee));
          }
        }
      } catch (error) {
        console.error('Error fetching delivery fee:', error);
      }
    };
    fetchFee();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/delivery-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee }),
      });

      if (res.ok) {
        setMessage('Delivery fee saved successfully!');
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Delivery Fee</h2>
      <p style={{ color: 'gray', marginBottom: '20px' }}>
        Set the delivery fee (in $) added to the order total at checkout.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="deliveryFee"
            style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Delivery Fee
          </label>
          <input
            id="deliveryFee"
            type="number"
            min="0"
            step="0.01"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="Enter delivery fee..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontSize: '16px',
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#343a40',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: '15px',
            color: message.startsWith('Error') ? 'red' : 'green',
            fontWeight: 'bold',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default DeliveryFeePage;
