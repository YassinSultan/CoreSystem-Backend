const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

// إنشاء schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'الاسم الاول مطلوب'],
        minlength: 2,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'كلمة المرور مطلوبة'],
        minlength: [8, 'كلمة المرور على الاقل 8 احرف وارقام'],
        match: [/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, "يجب أن تكون كلمة المرور على الأقل تحتوي على حرف صغير واحد و حرف كبير واحد وان تكون بطول 8 احرف وارقام على الاقل"]
    },
    phoneNumber: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        match: [/^(011|012|010|015)\d{8}$/, 'صيغة رقم الهاتف غير صالحة']
    },
    national_ID: {
        type: String,
        required: [true, 'الرقم القومي مطلوب'],
        unique: [true, 'الرقم القومي مستخدم بالفعل'],
        match: [/^\d{14}$/, 'الرقم القومي يجب ان يكون 14 رقم'],
    },
    address: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: "user",
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Not specified'],
        default: "Not specified",
        required: true
    },
    permissions: {
        type: [String],
        enum: ['add_user', 'update_user', 'delete_user', 'view_users', 'create project', 'update project', 'delete project'],
        default: [],
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updateHistory: [{
        _id: false,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    profileImage: {
        type: [String],
        default: null
    },
}, { timestamps: true });

// Middleware لتشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        user.password = await bcrypt.hash(user.password, saltRounds);
    }

    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
