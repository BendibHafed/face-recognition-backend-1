const clarifai = require('clarifai');

const handleImage = (req, res, pg_db) => {
    const { id, imageUrl } = req.body;
    if (!imageUrl || !id) {
        return res.status(400).json('Image URL and user ID are required!');
    }

    // Clarifai API setup
    const PAT = '252ed517949f435fa5d36d42fe0db88f'; // Still better to move this to environment variables
    const USER_ID = 's07ct5ryuzbx';
    const APP_ID = 'face-recognition-app';
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": imageUrl
                    }
                }
            }
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };
    
    fetch(`https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Clarifai API request failed');
            }
            return response.json();
        })
        .then(clarifaiData => {
            return pg_db('users')
                        .where('id', '=', id)
                        .increment('entries', 1)
                        .returning('entries')
                        .then(entries => {
                            res.json({
                                entries: entries[0].entries,
                                faceData: clarifaiData.outputs[0]
                            });
                        });
        })                        
        .catch(err => {
            console.error('Full Error:', err);
            // Ensure we only send one response
            if (!res.headersSent) {
              res.status(500).json({
                error: 'Image processing failed',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
              });
            }
          });
}
module.exports = {
    handleImage: handleImage
}