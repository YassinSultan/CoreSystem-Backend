class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    // Filter
    filter() {
        const excludeFields = ["sort", "fields", "keyword", "page", "limit", "populate"];
        const queryObj = { ...this.queryString };
        excludeFields.forEach(field => delete queryObj[field]);

        // إزالة المفاتيح التي قيمتها فارغة، `undefined` أو `null` + التعامل مع Boolean
        Object.entries(queryObj).forEach(([key, value]) => {
            if (!value || value.trim() === "") {
                delete queryObj[key];  // حذف المفتاح نهائيًا
            } else if (key === "isDeleted") {
                queryObj[key] = value === "true";  // تحويل إلى Boolean
            }
        });

        this.mongooseQuery = this.mongooseQuery.find(queryObj);
        return this;
    }

    // Sort
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        } else {
            this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
        }
        return this;
    }

    // Limit fields
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select("-__v");
        }
        return this;
    }

    // Search dynamically in text fields
    search(model) {
        if (this.queryString.keyword && this.queryString.keyword.trim() !== "") { // ✅ تحقق من أن الكلمة ليست فارغة
            const regex = new RegExp(this.queryString.keyword, "i");
            const schemaPaths = Object.keys(model.schema.paths);
            const textFields = schemaPaths.filter(path => model.schema.paths[path].instance === "String");

            if (textFields.length > 0) {
                this.mongooseQuery = this.mongooseQuery.find({
                    $or: textFields.map(field => ({ [field]: { $regex: regex } }))
                });
            }
        }
        return this;
    }

    // Pagination
    paginate() {
        if (this.queryString.limit) {
            const page = this.queryString.page * 1 || 1;
            const limit = this.queryString.limit * 1 || 10;
            const skip = (page - 1) * limit;
            this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

            this.paginationResult = { page, limit };
        }

        return this;
    }

    // ✅ Populate relationships
    populate() {
        if (this.queryString.populate) {
            const populateFields = this.queryString.populate.split(",");
            this.mongooseQuery = this.mongooseQuery.populate(
                populateFields.map(field => {
                    const [path, select] = field.split(":");
                    if (select) {
                        return { path, select: select.replace(/,/g, " ") };
                    }
                    return { path };
                })
            );
        }
        return this;
    }



}

module.exports = ApiFeatures;
