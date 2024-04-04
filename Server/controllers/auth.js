import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });
            const hashedPassword = await bcrypt.hash(password, 12);
        const token = crypto.randomBytes(20).toString('hex');
        const result = await User.create({ name, email, password: hashedPassword, confirmationToken: token });
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: result.email,
        subject: 'Account Verification Token',
        text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' +
            req.headers.host + '\/confirm\/' + result.confirmationToken + '\n'
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.status(200).json({ message: 'User successfully created. Check your email to confirm your account.' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};

export const confirmAccount = async (req, res) => {
    try {
        const user = await User.findOne({ confirmationToken: req.params.token });
        if (!user) return res.status(400).json({ message: 'Invalid confirmation token' });
        user.confirmed = true;
        user.confirmationToken = undefined;
        await user.save();
        res.status(200).json({ message: 'Account confirmed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: "User doesn't exist" });
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });
        if (!existingUser.confirmed) return res.status(401).json({ message: 'Please confirm your account first' });
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id },
        JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ result: existingUser, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};
export const logout = (req, res) => {
    res.json({ message: 'Logged out. Please remove your JWT token on your client.' });
};