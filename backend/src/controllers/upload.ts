import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp' 
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    const filePath = req.file.path;

    try {
        if (req.file.size < 2048) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return next(new BadRequestError('Файл слишком мал'));
        }

        try {
            const metadata = await sharp(filePath).metadata();
            const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
            if (!metadata.format || !allowedFormats.includes(metadata.format)) {
                throw new Error('Invalid format');
            }
        } catch (error) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return next(new BadRequestError('Файл не является валидным изображением'));
        }

        const fileExt = path.extname(req.file.originalname);
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const uploadDir = path.dirname(filePath);
        const newPath = path.join(uploadDir, safeName);
        fs.renameSync(filePath, newPath);

        const uploadPathEnv = process.env.UPLOAD_PATH || 'images';
        const fileName = `/${uploadPathEnv}/${safeName}`;

        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file.originalname,
        });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return next(error);
    }
}

export default {}