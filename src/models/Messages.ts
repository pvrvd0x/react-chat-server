import { Schema, model, Document } from "mongoose";

interface IMessage extends Document {
    text: string;
    unchecked: {
        type: boolean,
        default: boolean,
    };
    dialog: {
        type: Schema.Types.ObjectId,
        ref: string,
        required: boolean
    };
    user: {
        type: Schema.Types.ObjectId,
        ref: string,
        required: boolean
    }
}

const MessageSchema = new Schema({
    unchecked: {
        type: Boolean,
        default: true,
    },
    text: {
        type: String,
    },
    dialog: {
        type: Schema.Types.ObjectId,
        ref: 'Dialog',
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attachments: [{
        type: Schema.Types.ObjectId,
        ref: 'UploadedFile'
    }]
}, {
    timestamps: true,
    usePushEach: true
});

const MessageModel = model<IMessage>('Message', MessageSchema);

export default MessageModel;