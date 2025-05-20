const fetch = require('node-fetch');

const handleImage = (req, res, pg_db) => {
    const { id, imageUrl } = req.body;
    
    // Input validation
    if (!imageUrl || !id) {
      return res.status(400).json({ error: 'Image URL and user ID are required' });
    }
  
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
  
    // Clarifai API configuration
    const PAT = process.env.CLARIFAI_PAT;
    const USER_ID = 's07ct5ryuzbx';
    const APP_ID = 'face-recognition-app';
    const MODEL_ID = 'face-detection';
  
    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Key ${PAT}`
      },
      body: JSON.stringify({
        user_app_id: { user_id: USER_ID, app_id: APP_ID },
        inputs: [{ data: { image: { url: imageUrl } } }]
      })
    };
  
    // Execute the entire process
    (async () => {
      try {
        // Step 1: Call Clarifai API
        const apiResponse = await fetch(
          `https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`,
          requestOptions
        );
        
        if (!apiResponse.ok) {
          throw new Error('Clarifai API request failed');
        }
  
        const apiData = await apiResponse.json();
  
        // Step 2: Update database in transaction
        const result = await pg_db.transaction(async trx => {
            const rows = await trx('users')
              .where('id', id)
              .increment('entries', 1)
              .returning(['entries']);
          
            if (!rows || rows.length === 0) {
              throw new Error('User not found');
            }
          
            return {
              entries: rows[0].entries,
              faceData: apiData.outputs[0]
            };
          });
  
        // Step 3: Return success
        res.json(result);
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Image processing error:', error);
        }
        if (!res.headersSent) {
          return res.status(500).json({
            error: 'Image processing failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
            }
    })();
  };
  module.exports = { handleImage };
