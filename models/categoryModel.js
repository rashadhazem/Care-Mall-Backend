const mongoose = require('mongoose');

// 1- Create Schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category required'],
      unique: [true, 'Category must be unique'],
      minlength: [3, 'Too short category name'],
      maxlength: [50, 'Too long category name'],
    },
    // for url if the url of product contain space as Head phones The url be  head-phones
    slug: {
      type: String,
      lowercase: true,
    },
     image: {
      public_id: String,
      url: String,
    },
  },
  { timestamps: true } // to get the categories  by time 
);



// 2- Create model
const CategoryModel = mongoose.model('Category', categorySchema);

module.exports = CategoryModel;
