const jwt = require('jsonwebtoken')
require('dotenv').config()


module.exports = {
    generateToken: (id,role) => {
        const token = jwt.sign({ id, role }, process.env.JWTSECRET)
        return token
    },
    generateClubToken: (userId, clubId, role) => {
        const token = jwt.sign({ userId, clubId, role }, process.env.JWTSECRET)
        return token
    },

    verifyUserToken: async (req, res, next) => {
        try {
            let token = req.headers.authorization
            if (!token) {
                return res.status(403).json({ errMsg: "Access Denied" })
            }
            if (token.startsWith('Bearer')) {
                token = token.slice(7, token.length).trimLeft()
            }

            const verified = jwt.verify(token, process.env.JWTSECRET)

            if (verified.role === 'user') {
                req.payload = verified
                next()
            } else {
                return res.status(403).json({ errMsg: "Acess Denied" })
            }

        } catch (error) {
            res.status(500).json({ errMsg: "Server Error" })
        }
    },

    verifySuperAdminToken: async (req, res, next) => {
        try {
            let token = req.headers.authorization
            if (!token) {
                return res.status(403).json({ errMsg: "Access Denied" })
            }
            if (token.startsWith('Bearer')) {
                token = token.slice(7, token.length).trimLeft()
            }

            const verified = jwt.verify(token, process.env.JWTSECRET)

            if (verified.role === 'superAdmin') {
                req.payload = verified
                next()
            } else {
                return res.status(403).json({ errMsg: "Acess Denied" })
            }

        } catch (error) {
            res.status(500).json({ errMsg: "Server Error" })
        }
    },


    verifyClubAdminToken: async (req, res, next) => {
        try {
            let token = req.headers.authorization
            if (!token) {
                return res.status(403).json({ errMsg: "Access Denied" })
            }

            if (token.startsWith('Bearer')) {
                token = token.slice(7, token.length).trimLeft()
            }

            const verified = jwt.verify(token, process.env.JWTSECRET)

            if (verified.role === 'admin') {
                req.payload = verified
                next()
            } else {
                return res.status(403).json({ errMsg: "Acess Denied" })
            }

        } catch (error) {
            res.status(500).json({ errMsg: "Server Error" })
        }
    },

    verifyClubMemberToken: async (req, res, next) => {
        try {
            let token = req.headers.authorization
            if (!token) {
                return res.status(403).json({ errMsg: "Access Denied" })
            }

            if (token.startsWith('Bearer')) {
                token = token.slice(7, token.length).trimLeft()
            }

            const verified = jwt.verify(token, process.env.JWTSECRET)

            req.payload = verified

            next()

        } catch (error) {
            res.status(500).json({ errMsg: "Server Error" })
        }
    }
}