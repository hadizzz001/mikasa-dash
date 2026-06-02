'use client';

import { useState, useEffect } from 'react';

const OfferTextPage = () => {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing offer text on mount
  useEffect(() => {
    const fetchOfferText = async () => {
      try {
        const res = await fetch('/api/offer-text', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            setText(data.text);
          }
        }
      } catch (error) {
        console.error('Error fetching offer text:', error);
      }
    };
    fetchOfferText();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/offer-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        setMessage('Offer text saved successfully!');
        window.location.reload();
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
      <h2>Offer Text</h2>
      <p style={{ color: 'gray', marginBottom: '20px' }}>
        Set the offer text that will be displayed to users.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="offerText" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Offer Text
          </label>
          <input
            id="offerText"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter offer text..."
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

export default OfferTextPage;
