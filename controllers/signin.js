const handleSignin = (req, res, pg_db, bcrypt) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json('Unable to sign in!');
    }

    pg_db('login').select('email', 'hash')
        .where('email', '=', email)
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid) {
                pg_db('users').select('*').where('email', data[0].email)
                .then(user => {
                    res.json(user[0]);
                })
                .catch(err => res.status(400).json('unable to get user!'))
            } else {
                res.status(400).json("Wrong credentials");
            }
        })
        .catch(err => res.status(400).json(err));
    
    };

module.exports = {
    handleSignin : handleSignin
}
