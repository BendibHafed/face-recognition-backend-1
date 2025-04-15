const handleProfile = (req, res, pg_db) => {
    const { id } = req.params; 
    pg_db('users').where('id', '=', id).select('*')
        .then(user => {
            if (user.length) {
                res.json(user[0]);
            } else {
                res.status(400).json('Entry not found!');
            }
        })
        .catch(err => res.status(400).json('Error getting user!'));
};

module.exports = {
    handleProfile: handleProfile
}