const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel"); // تأكد أن المسار صحيح

const createAdminIfNotExists = async () => {
    try {
        const existingAdmin = await userModel.findOne({ role: "admin" });

        if (!existingAdmin) { // تأكد من استخدام كلمة مرور قوية
            const adminUser = new userModel({
                username: "admin",
                password: "Admin1234567",
                national_ID: "30208262601379",
                phoneNumber: "01129693575",
                gender: "Male",
                role: "admin",
                permissions: []
            });

            await adminUser.save();
            console.log("✅ Admin user created successfully!");
        } else {
            console.log("✅ Admin user already exists.");
        }
    } catch (error) {
        console.error("❌ Error creating admin user:", error);
    }
};

module.exports = createAdminIfNotExists;
