import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import path from 'path'
import fs from 'fs'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        const {file} = req;

        if (file.size < 2048) {

            fs.unlinkSync(file.path);
            return next(new BadRequestError('Файл слишком маленький (минимум 2kb)'));
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            fs.unlinkSync(file.path);
            return next(new BadRequestError('Недопустимый формат файла'));
        }

        const fileExt = path.extname(file.originalname);
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        
        const newPath = path.join(path.dirname(file.path), safeName);
        fs.renameSync(file.path, newPath);

        const uploadPath = process.env.UPLOAD_PATH || 'images';
        const fileName = `/${uploadPath}/${safeName}`;

        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: file.originalname,
        })
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        return next(error)
    }
}

export default {}