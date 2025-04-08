const addToArray = async (Model, docId, arrayField, newItem) => {
    try {
        const doc = await Model.findById(docId);
        if (!doc) throw new Error(`${Model.modelName} غير موجود`);

        doc[arrayField].push(newItem);
        await doc.save();
        return doc;
    } catch (error) {
        throw new Error(error.message);
    }
};

const removeFromArray = async (Model, docId, arrayField, subDocId) => {
    try {
        // جلب الوثيقة أولًا للبحث عن العنصر قبل الحذف
        const doc = await Model.findById(docId);
        if (!doc) throw new Error(`${Model.modelName} غير موجود`);

        // البحث عن العنصر المحذوف قبل الحذف
        const removedItem = doc[arrayField].find(item => item._id.toString() === subDocId);
        if (!removedItem) throw new Error("العنصر غير موجود");

        // تنفيذ الحذف باستخدام $pull
        await Model.findByIdAndUpdate(docId, { $pull: { [arrayField]: { _id: subDocId } } });

        return removedItem; // إرجاع العنصر المحذوف
    } catch (error) {
        throw new Error(error.message);
    }
};



module.exports = { addToArray, removeFromArray };
