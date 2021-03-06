import {Request, Response} from "express";
import { validationResult } from "express-validator";
import bcrypt from 'bcryptjs';
import { Server } from 'socket.io';
import transporter from "../core/nodemailer";
import path from 'path';

import { UserModel } from "../models";
import {createJWToken} from "../utils";
import { IUser } from "../models/User";


class UserController {
    private io: Server;

    constructor(io: Server) {
        this.io = io
    }


    public index(req: Request, res: Response) {
        const id: string = req.params.id;

        UserModel.findById(id, (err, user) => {
            if (err) {
                return res
                    .status(404)
                    .json({message: 'Not Found'})
            }
            res.json(user);
        })
    }

    public verify(req: Request, res: Response) {
        const hash = req.query.hash;
        
        if (!hash) {
            res.status(422).json({
                status: 'error',
                message: 'Hash not found',
            })
        }

        UserModel.findOne({ confirm_hash: hash }, (err, user) => {
            if (err || !user) {
                return res
                        .status(404)
                        .json({
                            status: 'error', 
                            message: 'Invalid Token Provided'
                        });
            }

            user.confirmed = true;

            user
                .save((err) => {
                    if (err) {
                        res.status(500).json({
                            status: 'error',
                            message: 'Error happened while confirmation'
                        })
                    }

                    res
                        .status(200)
                        .sendFile(path.join(__dirname, '../..', 'build', 'index.html'));
                })
        })
    }

    public getMe(req: any, res: Response) {
        const myId = req.user._id;

        UserModel.findById(myId, (err, user) => {
            if (err) {
                return res
                    .status(404)
                    .json({message: 'Not found'})
            }

            res.json(user);
        })
    }

    public create(req: Request, res: Response) {
        const postData: object = {
            email: req.body.email,
            fullname: req.body.fullname,
            password: req.body.password,
        };

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
        }
        
        const user = new UserModel(postData);

        user
            .save()
            .then((obj: any) => {
                const transportSettings = {
                    from: 'Slim Chat <slimchat90@gmail.com>',
                    to: 'd3m35s1ah@protonmail.com',
                    subject: 'Slim Chat account verification',
                    text: ` Hello There, and thank you for registration on Slim Chat
                            Here are your credentials
                            email: ${obj._doc.email}
                            name: ${obj._doc.fullname}
                            
                            Please follow this link to verify your account:
                            
                            https://slim-chat.herokuapp.com/user/verify?hash=${obj._doc.confirm_hash}
                            
                            Best Wishes, Slim Chat Support`,
                };

                transporter.sendMail(transportSettings, (err: Error | null, data: object) => {
                    if (err)
                        console.log(err);
                });

                res.status(200).json({...obj._doc, status: 'success'});
            })
            .catch(error => {
                res.status(500)
                    .json({
                        ...error, 
                        status: 'error'
                    });
            })
    }

    public findUsers(req: Request, res: Response) {
        const query: string = req.query.query;

        UserModel.find({
            $or: [
                { fullname: new RegExp(query, 'i') },
                { email: new RegExp(query, 'i') }
            ]
        })
        .then((users: any) => {
            res.json(users);
        })
        .catch(() => {
            return res.status(404).json({
                status: 'error',
                message: 'Not Found',
            })
        })
    }

    public delete(req: Request, res: Response) {
        const id = req.params.id;

        UserModel.findOneAndRemove({ _id: id })
            .then(user => {
                if (user) {
                    res.json({
                        status: 'success',
                        message: `User ${user.fullname} deleted`
                    })
                }
            })
            .catch(() => {
                res.json({
                    status: 'error',
                    message: 'Not Found'
                })
            });
    }

    public login(req: Request, res: Response) {
        const postData = {
            email: req.body.email,
            password: req.body.password,
        };

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
        }

        UserModel
            .findOne({ email: postData.email }, (err, user: IUser) => {
                if (err || !user) {
                    return res.status(404).json({message: 'User not found'});
                }

                if (bcrypt.compareSync(postData.password, user.password)) {
                    const token = createJWToken(user);
                    res.json({
                        status: 'success',
                        token,
                    });
                } else {
                    res.status(403).json({
                        status: 'error',
                        message: 'Incorrect password or email',
                    });
                }
            });
    };
}

export default UserController;
