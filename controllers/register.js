
const handleRegister = (req, res, pg_db, bcrypt) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission!');
    }
    const hash = bcrypt.hashSync(password);

    pg_db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(logEmail => {
            trx('users')
            .returning('*')
            .insert({
                email: logEmail[0].email,
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register!'));
};

module.exports = {
    handleRegister: handleRegister
}
